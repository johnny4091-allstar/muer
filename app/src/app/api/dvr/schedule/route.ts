import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueDvrJob, checkDvrQuota } from "@/lib/dvr";
import { z } from "zod";

const schema = z.object({
  deviceId: z.string(),
  channelId: z.string(),
  streamUrl: z.string().url(),
  title: z.string().min(1),
  episodeInfo: z.string().optional(),
  airDate: z.string().datetime().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Verify device belongs to this reseller
    const device = await prisma.device.findFirst({
      where: { id: data.deviceId, resellerId: session.user.id },
    });
    if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 });

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const durationSec = (end.getTime() - start.getTime()) / 1000;
    const estimatedBytes = BigInt(Math.ceil(durationSec * 2_000_000 / 8)); // ~2 Mbps estimate

    const hasQuota = await checkDvrQuota(device.id, estimatedBytes);
    if (!hasQuota) {
      return NextResponse.json({ error: "DVR storage quota exceeded" }, { status: 403 });
    }

    const schedule = await prisma.dvrSchedule.create({
      data: {
        deviceId: device.id,
        channelId: data.channelId,
        streamUrl: data.streamUrl,
        title: data.title,
        episodeInfo: data.episodeInfo,
        airDate: data.airDate ? new Date(data.airDate) : undefined,
        startTime: start,
        endTime: end,
        status: "PENDING",
      },
    });

    // Enqueue job for FFmpeg worker
    await enqueueDvrJob(schedule.id);

    return NextResponse.json({ id: schedule.id, status: "PENDING" }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("dvr schedule:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
