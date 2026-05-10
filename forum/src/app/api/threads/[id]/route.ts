import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMod = session.user.role === "MODERATOR" || session.user.role === "ADMIN";
  const isAuthor = thread.authorId === session.user.id;

  if (!isAuthor && !isMod) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { isPinned, isLocked, isSolved } = await req.json();

  const updated = await prisma.thread.update({
    where: { id },
    data: {
      ...(isPinned !== undefined && isMod && { isPinned }),
      ...(isLocked !== undefined && isMod && { isLocked }),
      ...(isSolved !== undefined && { isSolved }),
    },
  });

  return NextResponse.json({ thread: updated });
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMod = session.user.role === "MODERATOR" || session.user.role === "ADMIN";
  const isAuthor = thread.authorId === session.user.id;

  if (!isAuthor && !isMod) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.thread.update({
    where: { id },
    data: { isDeleted: true },
  });

  return NextResponse.json({ success: true });
}
