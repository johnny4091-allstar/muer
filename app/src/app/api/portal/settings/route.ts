import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  bufferSize: z.number().int().min(500).max(30000).optional(),
  epgRefreshInterval: z.number().int().min(300).max(86400).optional(),
  playbackOptions: z.record(z.unknown()).optional(),
});

const xtreamSchema = z.object({
  panelUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
});

const fullSchema = z.object({
  settings: settingsSchema.optional(),
  xtream: xtreamSchema.optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [fleetSettings, xtreamConfig] = await Promise.all([
    prisma.fleetSettings.findUnique({ where: { resellerId: session.user.id } }),
    prisma.xtreamConfig.findUnique({ where: { resellerId: session.user.id } }),
  ]);

  return NextResponse.json({
    settings: fleetSettings,
    xtream: xtreamConfig
      ? { panelUrl: xtreamConfig.panelUrl, username: xtreamConfig.username }
      : null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = fullSchema.parse(body);

    if (data.settings) {
      await prisma.fleetSettings.upsert({
        where: { resellerId: session.user.id },
        update: { ...data.settings, version: { increment: 1 } },
        create: { resellerId: session.user.id, ...data.settings },
      });
    }

    if (data.xtream) {
      await prisma.xtreamConfig.upsert({
        where: { resellerId: session.user.id },
        update: data.xtream,
        create: { resellerId: session.user.id, ...data.xtream },
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
