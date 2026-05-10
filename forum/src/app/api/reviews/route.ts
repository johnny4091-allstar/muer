import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints } from "@/lib/reputation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      include: { author: { select: { username: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.review.count(),
  ]);

  return NextResponse.json({ reviews, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    providerName, title, body,
    reliabilityRating, contentRating, priceRating, supportRating, overallRating,
  } = await req.json();

  if (!providerName || !title || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      authorId: session.user.id,
      providerName,
      title,
      body,
      reliabilityRating: reliabilityRating ?? 0,
      contentRating: contentRating ?? 0,
      priceRating: priceRating ?? 0,
      supportRating: supportRating ?? 0,
      overallRating: overallRating ?? 0,
    },
  });

  await awardPoints(session.user.id, "review_posted");

  return NextResponse.json({ review }, { status: 201 });
}
