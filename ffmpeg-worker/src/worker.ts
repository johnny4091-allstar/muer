import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { startRecording } from "./recorder";
import type { DvrJobPayload } from "./types";

const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const redisBlock = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const prisma = new PrismaClient();

const STORAGE_PATH = process.env.STORAGE_PATH || "/storage";

async function processJob(payload: DvrJobPayload): Promise<void> {
  const { scheduleId, channelId, streamUrl, title, startTime, endTime } = payload;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationSec = Math.ceil((end.getTime() - start.getTime()) / 1000);

  if (durationSec <= 0) {
    console.warn(`[DVR] Schedule ${scheduleId} has zero/negative duration, skipping`);
    return;
  }

  // Wait until start time
  const now = Date.now();
  const startMs = start.getTime();
  if (startMs > now) {
    const waitMs = startMs - now;
    console.log(`[DVR] Waiting ${waitMs}ms until recording starts for schedule ${scheduleId}`);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  // Shared recording dedup: check if another FFmpeg is already recording this stream
  const dedupKey = `dvr:active:${channelId}:${startTime}`;
  const existingPath = await redis.get(dedupKey);

  let filePath: string;
  let isShared = false;

  if (existingPath) {
    // Reuse the existing recording
    filePath = existingPath;
    isShared = true;
    console.log(`[DVR] Sharing existing recording at ${filePath} for schedule ${scheduleId}`);
  } else {
    // Start a new FFmpeg process
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const filename = `${scheduleId}_${safeTitle}_${Date.now()}.ts`;
    filePath = path.join("dvr", filename);
    const absolutePath = path.join(STORAGE_PATH, filePath);

    await redis.set(dedupKey, filePath, "EX", durationSec + 60);

    await prisma.dvrSchedule.update({
      where: { id: scheduleId },
      data: { status: "RECORDING" },
    });

    const recording = await prisma.dvrRecording.create({
      data: {
        scheduleId,
        filePath,
        title,
        channelId,
      },
    });

    console.log(`[DVR] Starting FFmpeg for schedule ${scheduleId}, output: ${absolutePath}`);

    await new Promise<void>((resolve, reject) => {
      startRecording({
        streamUrl,
        outputPath: absolutePath,
        durationSec,
        onProgress: ({ percent }) => {
          process.stdout.write(`\r[DVR] ${scheduleId}: ${percent.toFixed(1)}%`);
        },
        onComplete: async (sizeBytes) => {
          console.log(`\n[DVR] Complete: ${scheduleId}, size: ${sizeBytes} bytes`);
          await prisma.dvrRecording.update({
            where: { id: recording.id },
            data: { sizeBytes: BigInt(sizeBytes), durationSec, completedAt: new Date() },
          });
          await prisma.dvrSchedule.update({
            where: { id: scheduleId },
            data: { status: "DONE" },
          });
          // Update quota
          const device = await prisma.dvrSchedule
            .findUnique({ where: { id: scheduleId } })
            .then((s) => (s ? prisma.device.findUnique({ where: { id: s.deviceId } }) : null));
          if (device) {
            await prisma.dvrQuota.upsert({
              where: { deviceId: device.id },
              update: { usedBytes: { increment: BigInt(sizeBytes) } },
              create: { deviceId: device.id, usedBytes: BigInt(sizeBytes) },
            });
          }
          await redis.del(dedupKey);
          resolve();
        },
        onError: async (err) => {
          console.error(`\n[DVR] Error for ${scheduleId}:`, err.message);
          await prisma.dvrSchedule.update({
            where: { id: scheduleId },
            data: { status: "FAILED" },
          });
          await redis.del(dedupKey);
          reject(err);
        },
      });
    });

    return;
  }

  if (isShared) {
    // Just link to existing recording by creating a DvrRecording entry pointing to the same file
    await prisma.dvrSchedule.update({ where: { id: scheduleId }, data: { status: "RECORDING" } });
    await prisma.dvrRecording.create({ data: { scheduleId, filePath, title, channelId } });

    // Wait for the recording to complete (poll)
    while (await redis.exists(dedupKey)) {
      await new Promise((r) => setTimeout(r, 5000));
    }

    await prisma.dvrSchedule.update({ where: { id: scheduleId }, data: { status: "DONE" } });
  }
}

async function run(): Promise<void> {
  console.log("[DVR Worker] Started. Waiting for jobs...");

  while (true) {
    try {
      // Blocking pop from dvr:jobs queue
      const result = await redisBlock.blpop("dvr:jobs", 5);
      if (!result) continue;

      const [, raw] = result;
      const payload = JSON.parse(raw) as DvrJobPayload;
      console.log(`[DVR Worker] Processing schedule ${payload.scheduleId}`);

      // Process without blocking the queue
      processJob(payload).catch((err) => {
        console.error(`[DVR Worker] Job failed for ${payload.scheduleId}:`, err);
      });
    } catch (err) {
      console.error("[DVR Worker] Queue error:", err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

run().catch((err) => {
  console.error("[DVR Worker] Fatal:", err);
  process.exit(1);
});
