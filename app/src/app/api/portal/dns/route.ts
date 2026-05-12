import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DNS_LIMITS: Record<string, number> = {
  BASIC: 1,
  PRO: 5,
  ENTERPRISE: Infinity,
};

const schema = z.object({
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
  targetIp: z.string().ip(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.dnsEntry.findMany({
    where: { resellerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries, limit: DNS_LIMITS[session.user.tier] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const limit = DNS_LIMITS[session.user.tier];
    const count = await prisma.dnsEntry.count({ where: { resellerId: session.user.id } });

    if (count >= limit) {
      return NextResponse.json(
        { error: `DNS limit reached for your tier (${limit})` },
        { status: 403 }
      );
    }

    const entry = await prisma.dnsEntry.create({
      data: { resellerId: session.user.id, ...data },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.dnsEntry.deleteMany({
    where: { id, resellerId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
