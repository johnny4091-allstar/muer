import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  appName: z.string().min(1).max(50),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  branch: z.enum(["main", "beta"]).default("main"),
  logoPath: z.string().optional(),
  splashPath: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const [builds, total] = await Promise.all([
    prisma.appBuild.findMany({
      where: { resellerId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appBuild.count({ where: { resellerId: session.user.id } }),
  ]);

  return NextResponse.json({ builds, total });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const build = await prisma.appBuild.create({
      data: { resellerId: session.user.id, ...data, status: "QUEUED" },
    });

    // In a real deployment, this would enqueue to a CI/CD pipeline.
    // For now, the build stays in QUEUED state and can be managed externally.

    return NextResponse.json(build, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, downloadUrl, buildLog } = body;

  const build = await prisma.appBuild.findFirst({
    where: { id, resellerId: session.user.id },
  });
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.appBuild.update({
    where: { id },
    data: {
      status,
      downloadUrl,
      buildLog,
      ...(status === "SUCCESS" || status === "FAILED" ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(updated);
}
