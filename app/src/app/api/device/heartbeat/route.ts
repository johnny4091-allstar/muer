import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateDeviceToken,
  extractBearerToken,
  generateDeviceToken,
  storeDeviceToken,
} from "@/lib/device-auth";
import { getPendingCommands, markCommandsDelivered } from "@/lib/commands";
import type { HeartbeatResponse } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  deviceId: z.string().min(1),
  appVersion: z.string().optional(),
});

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
    const data = schema.parse(body);

    if (auth.deviceId !== data.deviceId) {
      return NextResponse.json({ error: "Device ID mismatch" }, { status: 401 });
    }

    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown";

    const device = await prisma.device.update({
      where: { deviceId: data.deviceId },
      data: {
        lastSeenAt: new Date(),
        isOnline: true,
        ipAddress: ip,
        ...(data.appVersion ? { appVersion: data.appVersion } : {}),
      },
    });

    // Pending commands
    const pendingCmds = await getPendingCommands(device.id);
    if (pendingCmds.length > 0) {
      await markCommandsDelivered(pendingCmds.map((c) => c.id));
    }

    // Fleet settings
    const settings = await prisma.fleetSettings.findUnique({
      where: { resellerId: device.resellerId },
    });

    // Pending broadcasts
    const pendingBroadcasts = await prisma.broadcastDelivery.findMany({
      where: { deviceId: device.id, deliveredAt: null },
      include: { broadcast: true },
      take: 10,
    });
    if (pendingBroadcasts.length > 0) {
      await prisma.broadcastDelivery.updateMany({
        where: { id: { in: pendingBroadcasts.map((b) => b.id) } },
        data: { deliveredAt: new Date() },
      });
    }

    const response: HeartbeatResponse = {
      commands: pendingCmds.map((c) => ({
        id: c.id,
        type: c.type,
        payload: c.payload as Record<string, unknown> | null,
      })),
      settings: settings
        ? {
            bufferSize: settings.bufferSize,
            epgRefreshInterval: settings.epgRefreshInterval,
            playbackOptions: settings.playbackOptions as Record<string, unknown> | null,
            version: settings.version,
          }
        : null,
      broadcasts: pendingBroadcasts.map((b) => ({
        id: b.id,
        broadcastId: b.broadcastId,
        title: b.broadcast.title,
        body: b.broadcast.body,
      })),
    };

    if (auth.shouldRefresh) {
      const newToken = generateDeviceToken(data.deviceId);
      await storeDeviceToken(data.deviceId, newToken);
      response.tokenRefresh = newToken;
    }

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("heartbeat error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
