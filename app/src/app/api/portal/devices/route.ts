import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const onlineOnly = searchParams.get("online") === "true";
  const version = searchParams.get("version") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const where = {
    resellerId: session.user.id,
    ...(onlineOnly ? { isOnline: true } : {}),
    ...(version ? { appVersion: version } : {}),
    ...(search
      ? {
          OR: [
            { deviceId: { contains: search, mode: "insensitive" as const } },
            { ipAddress: { contains: search, mode: "insensitive" as const } },
            { model: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.device.count({ where }),
  ]);

  return NextResponse.json({ devices, total, page, limit });
}
