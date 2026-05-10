import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, reason, description } = await req.json();
  if (!reason) return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  if (!postId) return NextResponse.json({ error: "Must report a post" }, { status: 400 });

  const existing = await prisma.report.findFirst({
    where: { reportedById: session.user.id, postId },
  });
  if (existing) return NextResponse.json({ error: "You already reported this" }, { status: 409 });

  const report = await prisma.report.create({
    data: {
      reportedById: session.user.id,
      postId,
      reason,
      description: description ?? null,
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
