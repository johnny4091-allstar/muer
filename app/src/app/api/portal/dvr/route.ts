import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const devices = await prisma.device.findMany({
    where: { resellerId: session.user.id },
    select: { id: true },
  });
  const deviceIds = devices.map((d) => d.id);

  const where = {
    deviceId: { in: deviceIds },
    ...(status ? { status: status as "PENDING" | "RECORDING" | "DONE" | "FAILED" | "CANCELLED" } : {}),
  };

  const [schedules, total] = await Promise.all([
    prisma.dvrSchedule.findMany({
      where,
      orderBy: { startTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        device: { select: { deviceId: true, model: true } },
        recording: true,
      },
    }),
    prisma.dvrSchedule.count({ where }),
  ]);

  return NextResponse.json({ schedules, total });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const devices = await prisma.device.findMany({
    where: { resellerId: session.user.id },
    select: { id: true },
  });
  const deviceIds = devices.map((d) => d.id);

  const schedule = await prisma.dvrSchedule.findFirst({
    where: { id, deviceId: { in: deviceIds } },
  });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.dvrSchedule.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
