import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { settings } = await req.json();
  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  await Promise.all(
    Object.entries(settings as Record<string, string>).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );

  return NextResponse.json({ success: true });
}
