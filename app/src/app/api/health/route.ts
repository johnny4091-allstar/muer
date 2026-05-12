import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return NextResponse.json({ status: "ok", db: "connected", redis: "connected" });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: String(err) },
      { status: 503 }
    );
  }
}
