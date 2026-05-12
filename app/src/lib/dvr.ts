import { prisma } from "./prisma";
import { redis } from "./redis";

export interface DvrJobPayload {
  scheduleId: string;
  deviceId: string;
  channelId: string;
  streamUrl: string;
  title: string;
  startTime: string;
  endTime: string;
}

export async function enqueueDvrJob(scheduleId: string): Promise<void> {
  const schedule = await prisma.dvrSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule) return;

  const payload: DvrJobPayload = {
    scheduleId,
    deviceId: schedule.deviceId,
    channelId: schedule.channelId,
    streamUrl: schedule.streamUrl,
    title: schedule.title,
    startTime: schedule.startTime.toISOString(),
    endTime: schedule.endTime.toISOString(),
  };

  await redis.rpush("dvr:jobs", JSON.stringify(payload));
}

export async function checkDvrQuota(
  deviceId: string,
  estimatedBytes: bigint
): Promise<boolean> {
  let quota = await prisma.dvrQuota.findUnique({ where: { deviceId } });
  if (!quota) {
    quota = await prisma.dvrQuota.create({ data: { deviceId } });
  }
  return quota.usedBytes + estimatedBytes <= quota.quotaBytes;
}

export async function getDvrActiveKey(channelId: string, startTime: string): Promise<string> {
  return `dvr:active:${channelId}:${startTime}`;
}
