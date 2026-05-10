import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.verificationToken.upsert({
        where: { identifier_token: { identifier: `reset:${email}`, token: "dummy" } },
        update: { token, expires: new Date(Date.now() + 60 * 60 * 1000) },
        create: {
          identifier: `reset:${email}`,
          token,
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      }).catch(async () => {
        await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } });
        await prisma.verificationToken.create({
          data: { identifier: `reset:${email}`, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
        });
      });

      try { await sendPasswordResetEmail(email, token); } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
