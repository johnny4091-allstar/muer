import { NextRequest, NextResponse } from "next/server";
import { validateDeviceToken, extractBearerToken } from "@/lib/device-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Supports both session (web player) and device token auth
  const session = await getServerSession(authOptions);
  const token = extractBearerToken(req.headers.get("authorization"));

  let deviceId: string | undefined;

  if (session) {
    const { searchParams } = new URL(req.url);
    const devId = searchParams.get("deviceId");
    if (!devId) return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
    const device = await prisma.device.findFirst({
      where: { id: devId, resellerId: session.user.id },
    });
    if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });
    deviceId = device.id;
  } else if (token) {
    const auth = await validateDeviceToken(token);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const device = await prisma.device.findUnique({ where: { deviceId: auth.deviceId } });
    if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });
    deviceId = device.id;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { deviceId },
    orderBy: { createdAt: "asc" },
  });

  const grouped = {
    channels: favorites.filter((f) => f.itemType === "CHANNEL"),
    movies: favorites.filter((f) => f.itemType === "MOVIE"),
    series: favorites.filter((f) => f.itemType === "SERIES"),
  };

  return NextResponse.json(grouped);
}
