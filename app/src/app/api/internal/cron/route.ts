import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshEpgCache } from "@/lib/epg";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results: Record<string, unknown> = {};

  // 1. Mark offline devices (lastSeenAt < now - 5min)
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  const { count: markedOffline } = await prisma.device.updateMany({
    where: { isOnline: true, lastSeenAt: { lt: cutoff } },
    data: { isOnline: false },
  });
  results.markedOffline = markedOffline;

  // 2. Refresh EPG caches for all resellers
  const resellers = await prisma.reseller.findMany({
    where: { xtreamConfig: { isNot: null } },
    select: { id: true },
  });

  const epgResults = await Promise.allSettled(
    resellers.map((r) => refreshEpgCache(r.id))
  );
  results.epgRefreshed = epgResults.filter((r) => r.status === "fulfilled").length;

  // 3. Cleanup old delivered commands (older than 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { count: deletedCmds } = await prisma.deviceCommand.deleteMany({
    where: { status: "DELIVERED", deliveredAt: { lt: sevenDaysAgo } },
  });
  results.cleanedCommands = deletedCmds;

  // 4. Mark web player deployments offline if no heartbeat in 5min
  await prisma.webPlayerDeployment.updateMany({
    where: { isOnline: true, lastHeartbeat: { lt: cutoff } },
    data: { isOnline: false },
  });

  return NextResponse.json({ ok: true, ...results });
}
