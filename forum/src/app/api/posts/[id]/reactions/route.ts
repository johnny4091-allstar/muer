import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints, getReactionEvent } from "@/lib/reputation";
import type { ReactionType } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const { type } = await req.json() as { type: ReactionType };

  const validTypes: ReactionType[] = ["LIKE", "LOVE", "LAUGH", "ANGRY", "SAD", "HELPFUL", "DISLIKE"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId_type: { postId, userId: session.user.id, type } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { postId, userId: session.user.id, type } });

    // Award points to post author
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post && post.authorId !== session.user.id) {
      const event = getReactionEvent(type);
      if (event) await awardPoints(post.authorId, event);
    }
  }

  const reactions = await prisma.reaction.findMany({ where: { postId } });
  return NextResponse.json({ reactions });
}
