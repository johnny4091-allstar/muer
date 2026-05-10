import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints } from "@/lib/reputation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: threadId } = await params;

  try {
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const thread = await prisma.thread.findUnique({ where: { id: threadId, isDeleted: false } });
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    if (thread.isLocked) return NextResponse.json({ error: "Thread is locked" }, { status: 403 });

    const post = await prisma.$transaction(async (tx) => {
      const p = await tx.post.create({
        data: { threadId, authorId: session.user.id, content },
      });

      await tx.thread.update({
        where: { id: threadId },
        data: { replyCount: { increment: 1 }, lastPostAt: new Date(), lastPostUserId: session.user.id },
      });

      await tx.profile.update({
        where: { userId: session.user.id },
        data: { postCount: { increment: 1 } },
      });

      // Notify thread subscribers
      const subs = await tx.threadSubscription.findMany({ where: { threadId, userId: { not: session.user.id } } });
      if (subs.length) {
        await tx.notification.createMany({
          data: subs.map((s) => ({
            userId: s.userId,
            type: "NEW_POST_IN_SUBSCRIBED",
            title: `New reply in "${thread.title}"`,
            body: content.replace(/<[^>]*>/g, "").slice(0, 100),
            actionUrl: `/threads/${threadId}`,
            actorId: session.user.id,
          })),
        });
      }

      return p;
    });

    await awardPoints(session.user.id, "post_created");

    return NextResponse.json({ id: post.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
