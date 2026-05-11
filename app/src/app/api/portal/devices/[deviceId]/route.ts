import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const device = await prisma.device.findFirst({
    where: { id: params.deviceId, resellerId: session.user.id },
    include: {
      commands: { orderBy: { createdAt: "desc" }, take: 20 },
      errorLogs: { orderBy: { occurredAt: "desc" }, take: 20 },
      quota: true,
    },
  });

  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(device);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const device = await prisma.device.findFirst({
    where: { id: params.deviceId, resellerId: session.user.id },
  });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.device.delete({ where: { id: params.deviceId } });
  return NextResponse.json({ success: true });
}
