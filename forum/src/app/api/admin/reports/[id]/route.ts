import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action, postId } = await req.json();

  try {
    if (action === "delete_post" && postId) {
      await prisma.post.update({ where: { id: postId }, data: { isDeleted: true } });
    }

    await prisma.report.update({
      where: { id },
      data: { status: action === "dismiss" ? "DISMISSED" : "RESOLVED", resolvedAt: new Date(), resolvedById: session.user.id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: action === "delete_post" ? "DELETE_POST_FROM_REPORT" : action === "dismiss" ? "DISMISS_REPORT" : "RESOLVE_REPORT",
        targetType: "Report",
        targetId: id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
