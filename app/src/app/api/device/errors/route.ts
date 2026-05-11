import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateDeviceToken, extractBearerToken } from "@/lib/device-auth";
import { z } from "zod";

const errorSchema = z.object({
  type: z.enum(["STUCK_PLAYER", "PLAYBACK_FAILED", "NUCLEAR_RECOVERY", "UNKNOWN"]),
  streamUrl: z.string().optional(),
  recoveryStatus: z.string().optional(),
  raw: z.record(z.unknown()).optional(),
});

const schema = z.array(errorSchema).max(50);

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = await validateDeviceToken(token);
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const errors = schema.parse(body);

    const device = await prisma.device.findUnique({
      where: { deviceId: auth.deviceId },
    });
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    await prisma.errorLog.createMany({
      data: errors.map((e) => ({
        deviceId: device.id,
        errorType: e.type,
        streamUrl: e.streamUrl,
        recoveryStatus: e.recoveryStatus,
        raw: e.raw,
      })),
    });

    return NextResponse.json({ accepted: errors.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("device errors ingest:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
