import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resellerId = session.user.id;
  const now = new Date();
  const tenMin = new Date(now.getTime() - 10 * 60 * 1000);
  const oneDday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [total, online, recent, active] = await Promise.all([
    prisma.device.count({ where: { resellerId } }),
    prisma.device.count({ where: { resellerId, isOnline: true } }),
    prisma.device.count({ where: { resellerId, lastSeenAt: { gte: tenMin } } }),
    prisma.device.count({ where: { resellerId, lastSeenAt: { gte: oneDday } } }),
  ]);

  return NextResponse.json({ total, online, recent, active });
}
