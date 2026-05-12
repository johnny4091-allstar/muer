import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const errorType = searchParams.get("type");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const devices = await prisma.device.findMany({
    where: { resellerId: session.user.id },
    select: { id: true },
  });
  const deviceIds = devices.map((d) => d.id);

  const where = {
    deviceId: { in: deviceIds },
    ...(errorType ? { errorType: errorType as "STUCK_PLAYER" | "PLAYBACK_FAILED" | "NUCLEAR_RECOVERY" | "UNKNOWN" } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { device: { select: { deviceId: true, model: true } } },
    }),
    prisma.errorLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total });
}
