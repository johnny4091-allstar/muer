import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateDeviceToken, extractBearerToken } from "@/lib/device-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  deviceId: z.string(),
  action: z.enum(["add", "remove"]),
  itemType: z.enum(["CHANNEL", "MOVIE", "SERIES"]),
  itemId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const token = extractBearerToken(req.headers.get("authorization"));

  let resolvedDeviceId: string | undefined;

  if (session) {
    const body = await req.json();
    const data = schema.parse(body);
    const device = await prisma.device.findFirst({
      where: { id: data.deviceId, resellerId: session.user.id },
    });
    if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });
    resolvedDeviceId = device.id;

    if (data.action === "add") {
      await prisma.favorite.upsert({
        where: { deviceId_itemType_itemId: { deviceId: resolvedDeviceId, itemType: data.itemType, itemId: data.itemId } },
        update: { metadata: data.metadata as Prisma.InputJsonValue },
        create: { deviceId: resolvedDeviceId, itemType: data.itemType, itemId: data.itemId, metadata: data.metadata as Prisma.InputJsonValue },
      });
    } else {
      await prisma.favorite.deleteMany({
        where: { deviceId: resolvedDeviceId, itemType: data.itemType, itemId: data.itemId },
      });
    }
    return NextResponse.json({ success: true });
  }

  if (token) {
    const auth = await validateDeviceToken(token);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const data = schema.parse(body);
    const device = await prisma.device.findUnique({ where: { deviceId: auth.deviceId } });
    if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (data.action === "add") {
      await prisma.favorite.upsert({
        where: { deviceId_itemType_itemId: { deviceId: device.id, itemType: data.itemType, itemId: data.itemId } },
        update: { metadata: data.metadata },
        create: { deviceId: device.id, itemType: data.itemType, itemId: data.itemId, metadata: data.metadata },
      });
    } else {
      await prisma.favorite.deleteMany({
        where: { deviceId: device.id, itemType: data.itemType, itemId: data.itemId },
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
