import { prisma } from "./prisma";
import { redis } from "./redis";
import { getXtreamClient } from "./xtream";

const EPG_REFRESH_TTL = 3600; // 1 hour

export async function refreshEpgCache(resellerId: string): Promise<void> {
  const lockKey = `epg:refresh:lock:${resellerId}`;
  const lastRefreshKey = `epg:lastRefresh:${resellerId}`;

  // Anti-stampede: skip if already refreshed recently
  const lastRefresh = await redis.get(lastRefreshKey);
  if (lastRefresh) return;

  // Distributed lock
  const locked = await redis.set(lockKey, "1", "EX", 120, "NX");
  if (!locked) return;

  try {
    const client = await getXtreamClient(resellerId);
    if (!client) return;

    const channels = await client.getLiveChannels();

    // Fetch short EPG for each channel (4 programs = current + next 3)
    const epgBatches = await Promise.allSettled(
      channels.slice(0, 500).map(async (ch) => {
        try {
          const data = await client.getShortEpg(ch.stream_id, 4);
          return { channelId: String(ch.stream_id), programs: data.epg_listings };
        } catch {
          return null;
        }
      })
    );

    const rows: Array<{
      channelId: string;
      resellerId: string;
      title: string;
      description: string | null;
      startTime: Date;
      endTime: Date;
      category: string | null;
      poster: string | null;
      cachedAt: Date;
    }> = [];

    const now = new Date();

    for (const result of epgBatches) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const { channelId, programs } = result.value;
      for (const p of programs) {
        rows.push({
          channelId,
          resellerId,
          title: p.title || "Unknown",
          description: p.description || null,
          startTime: new Date(p.start),
          endTime: new Date(p.end),
          category: null,
          poster: null,
          cachedAt: now,
        });
      }
    }

    if (rows.length > 0) {
      await prisma.$transaction(
        rows.map((row) =>
          prisma.epgEntry.upsert({
            where: {
              channelId_resellerId_startTime: {
                channelId: row.channelId,
                resellerId: row.resellerId,
                startTime: row.startTime,
              },
            },
            update: { title: row.title, description: row.description, endTime: row.endTime, cachedAt: row.cachedAt },
            create: row,
          })
        )
      );
    }

    await redis.set(lastRefreshKey, Date.now().toString(), "EX", EPG_REFRESH_TTL);
  } finally {
    await redis.del(lockKey);
  }
}

export async function getEpgForChannel(
  channelId: string,
  resellerId: string,
  from?: Date,
  to?: Date
) {
  const start = from || new Date(Date.now() - 2 * 60 * 60 * 1000);
  const end = to || new Date(Date.now() + 6 * 60 * 60 * 1000);

  return prisma.epgEntry.findMany({
    where: {
      channelId,
      resellerId,
      startTime: { gte: start },
      endTime: { lte: end },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getCurrentProgram(channelId: string, resellerId: string) {
  const now = new Date();
  return prisma.epgEntry.findFirst({
    where: {
      channelId,
      resellerId,
      startTime: { lte: now },
      endTime: { gte: now },
    },
  });
}
