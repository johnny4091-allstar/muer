import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  targetAll: z.boolean().default(true),
  targetIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    let targetDeviceIds: string[] = [];

    if (data.targetAll) {
      const devices = await prisma.device.findMany({
        where: { resellerId: session.user.id },
        select: { id: true },
      });
      targetDeviceIds = devices.map((d) => d.id);
    } else if (data.targetIds?.length) {
      const devices = await prisma.device.findMany({
        where: { id: { in: data.targetIds }, resellerId: session.user.id },
        select: { id: true },
      });
      targetDeviceIds = devices.map((d) => d.id);
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        resellerId: session.user.id,
        title: data.title,
        body: data.body,
        targetAll: data.targetAll,
        targetIds: targetDeviceIds,
        status: "SENDING",
      },
    });

    await prisma.broadcastDelivery.createMany({
      data: targetDeviceIds.map((deviceId) => ({
        broadcastId: broadcast.id,
        deviceId,
      })),
    });

    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { status: "DONE" },
    });

    return NextResponse.json({ id: broadcast.id, sent: targetDeviceIds.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const [broadcasts, total] = await Promise.all([
    prisma.broadcast.findMany({
      where: { resellerId: session.user.id },
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { deliveries: true } },
      },
    }),
    prisma.broadcast.count({ where: { resellerId: session.user.id } }),
  ]);

  return NextResponse.json({ broadcasts, total });
}
