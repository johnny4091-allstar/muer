import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  vpsIp: z.string().ip(),
  label: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deployments = await prisma.webPlayerDeployment.findMany({
    where: { resellerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ deployments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const instanceId = crypto.randomBytes(16).toString("hex");
    const appUrl = process.env.NEXTAUTH_URL || "https://your-portal.com";

    const deployment = await prisma.webPlayerDeployment.create({
      data: {
        resellerId: session.user.id,
        vpsIp: data.vpsIp,
        instanceId,
        label: data.label,
      },
    });

    // Generate the one-line install command
    const installCmd =
      `curl -fsSL ${appUrl}/web-player-install.sh | ` +
      `INSTANCE_ID=${instanceId} PORTAL_URL=${appUrl} bash`;

    return NextResponse.json({ deployment, installCmd }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Called by deployed web player instances for heartbeat
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { instanceId } = body;
  if (!instanceId) return NextResponse.json({ error: "Missing instanceId" }, { status: 400 });

  await prisma.webPlayerDeployment.update({
    where: { instanceId },
    data: { isOnline: true, lastHeartbeat: new Date() },
  });

  return NextResponse.json({ ok: true });
}
