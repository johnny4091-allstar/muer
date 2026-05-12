import crypto from "crypto";
import { redis } from "./redis";

const SALT = process.env.DEVICE_API_KEY_SALT!;
const TOKEN_TTL = 90 * 24 * 60 * 60; // 90 days in seconds
const REFRESH_THRESHOLD = 7 * 24 * 60 * 60; // 7 days

export function generateDeviceToken(deviceId: string): string {
  return crypto.createHmac("sha256", SALT).update(deviceId).digest("hex");
}

export async function storeDeviceToken(deviceId: string, token: string): Promise<void> {
  await redis.set(`device:token:${token}`, deviceId, "EX", TOKEN_TTL);
}

export async function validateDeviceToken(
  token: string
): Promise<{ deviceId: string; shouldRefresh: boolean } | null> {
  const key = `device:token:${token}`;
  const deviceId = await redis.get(key);
  if (!deviceId) return null;

  const ttl = await redis.ttl(key);
  const shouldRefresh = ttl < REFRESH_THRESHOLD;
  if (shouldRefresh) {
    await redis.expire(key, TOKEN_TTL);
  }

  return { deviceId, shouldRefresh };
}

export async function revokeDeviceToken(token: string): Promise<void> {
  await redis.del(`device:token:${token}`);
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
