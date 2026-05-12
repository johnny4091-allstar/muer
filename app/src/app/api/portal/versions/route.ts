import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  masterVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  autoUpdate: z.boolean().optional(),
  pins: z.array(z.object({ deviceId: z.string(), pinnedVersion: z.string() })).optional(),
  removePin: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.versionConfig.findUnique({
    where: { resellerId: session.user.id },
    include: { pins: true },
  });

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const config = await prisma.versionConfig.upsert({
      where: { resellerId: session.user.id },
      update: {
        ...(data.masterVersion ? { masterVersion: data.masterVersion } : {}),
        ...(data.autoUpdate !== undefined ? { autoUpdate: data.autoUpdate } : {}),
      },
      create: {
        resellerId: session.user.id,
        masterVersion: data.masterVersion || "1.0.0",
        autoUpdate: data.autoUpdate ?? true,
      },
    });

    if (data.pins?.length) {
      await prisma.$transaction(
        data.pins.map((pin) =>
          prisma.versionPin.upsert({
            where: { versionConfigId_deviceId: { versionConfigId: config.id, deviceId: pin.deviceId } },
            update: { pinnedVersion: pin.pinnedVersion },
            create: { versionConfigId: config.id, deviceId: pin.deviceId, pinnedVersion: pin.pinnedVersion },
          })
        )
      );
    }

    if (data.removePin) {
      await prisma.versionPin.deleteMany({
        where: { versionConfigId: config.id, deviceId: data.removePin },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
