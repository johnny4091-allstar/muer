import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const secret = speakeasy.generateSecret({
    name: `StreamZone (${user.email})`,
    length: 32,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret.base32 },
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url ?? "");

  return NextResponse.json({ secret: secret.base32, qrCode });
}
