import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { receiverId, content } = await req.json();
    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { senderId: session.user.id, receiverId, content: content.trim() },
    });

    // Emit socket event
    const io = (globalThis as any).__socketIO;
    if (io) {
      io.to(`user:${receiverId}`).emit("dm:received", {
        id: message.id,
        senderId: session.user.id,
        content: message.content,
        createdAt: message.createdAt,
      });
      io.to(`user:${receiverId}`).emit("notification", {
        type: "DM_RECEIVED",
        title: `New message from ${session.user.username}`,
        actionUrl: `/messages/${session.user.id}`,
        createdAt: new Date(),
      });
    }

    // Create notification in DB
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "DM_RECEIVED",
        title: `New message from ${session.user.username}`,
        actionUrl: `/messages/${session.user.id}`,
        actorId: session.user.id,
      },
    });

    return NextResponse.json({ id: message.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
