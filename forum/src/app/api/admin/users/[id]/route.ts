import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot modify own account" }, { status: 400 });
  }

  try {
    let data: any = {};
    let auditAction = "";

    switch (action) {
      case "ban":
        data = { isBanned: true };
        auditAction = "BAN_USER";
        break;
      case "unban":
        data = { isBanned: false };
        auditAction = "UNBAN_USER";
        break;
      case "make_mod":
        data = { role: "MODERATOR" };
        auditAction = "PROMOTE_MODERATOR";
        break;
      case "demote":
        data = { role: "USER" };
        auditAction = "DEMOTE_USER";
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await prisma.user.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: auditAction,
        targetType: "User",
        targetId: id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
