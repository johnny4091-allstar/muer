import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDeviceToken, storeDeviceToken } from "@/lib/device-auth";
import { z } from "zod";

const schema = z.object({
  deviceId: z.string().min(1),
  resellerId: z.string().min(1),
  model: z.string().optional(),
  appVersion: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const reseller = await prisma.reseller.findUnique({
      where: { id: data.resellerId },
    });
    if (!reseller) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown";

    await prisma.device.upsert({
      where: { deviceId: data.deviceId },
      update: {
        model: data.model,
        appVersion: data.appVersion,
        ipAddress: ip,
        lastSeenAt: new Date(),
        isOnline: true,
      },
      create: {
        deviceId: data.deviceId,
        resellerId: data.resellerId,
        model: data.model,
        appVersion: data.appVersion,
        ipAddress: ip,
        lastSeenAt: new Date(),
        isOnline: true,
      },
    });

    const token = generateDeviceToken(data.deviceId);
    await storeDeviceToken(data.deviceId, token);

    return NextResponse.json({ deviceToken: token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("register error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
