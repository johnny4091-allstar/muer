import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const devices = await prisma.device.findMany({
    where: {
      resellerId: session.user.id,
      ...(deviceId ? { id: deviceId } : {}),
    },
    select: { id: true },
  });
  const deviceIds = devices.map((d) => d.id);

  const [recordings, total] = await Promise.all([
    prisma.dvrRecording.findMany({
      where: { schedule: { deviceId: { in: deviceIds } } },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { schedule: { select: { title: true, channelId: true, status: true } } },
    }),
    prisma.dvrRecording.count({
      where: { schedule: { deviceId: { in: deviceIds } } },
    }),
  ]);

  return NextResponse.json({ recordings, total });
}
