import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueBulkCommands } from "@/lib/commands";
import { z } from "zod";

const schema = z.object({
  deviceIds: z.array(z.string()).min(1),
  type: z.enum(["MESSAGE", "CLEAR_CACHE", "RESTART", "FORCE_UPDATE", "TERMINATE", "WIPE", "PUSH_SETTINGS"]),
  payload: z.record(z.unknown()).optional(),
  allDevices: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    let deviceIds = data.deviceIds;

    if (data.allDevices) {
      const devices = await prisma.device.findMany({
        where: { resellerId: session.user.id },
        select: { id: true },
      });
      deviceIds = devices.map((d) => d.id);
    } else {
      // Verify all deviceIds belong to this reseller
      const devices = await prisma.device.findMany({
        where: { id: { in: deviceIds }, resellerId: session.user.id },
        select: { id: true },
      });
      deviceIds = devices.map((d) => d.id);
    }

    if (deviceIds.length === 0) {
      return NextResponse.json({ error: "No valid devices" }, { status: 400 });
    }

    await enqueueBulkCommands(deviceIds, data.type, data.payload);

    return NextResponse.json({ queued: deviceIds.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("portal commands:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");

  const devices = await prisma.device.findMany({
    where: { resellerId: session.user.id, ...(deviceId ? { id: deviceId } : {}) },
    select: { id: true },
  });
  const deviceIds = devices.map((d) => d.id);

  const commands = await prisma.deviceCommand.findMany({
    where: { deviceId: { in: deviceIds } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { device: { select: { deviceId: true, model: true } } },
  });

  return NextResponse.json({ commands });
}
