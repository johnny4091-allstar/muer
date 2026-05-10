import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints } from "@/lib/reputation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, m3uUrl, tags, channelCount, status } = body;

    if (!title?.trim() || !m3uUrl?.trim()) {
      return NextResponse.json({ error: "Title and M3U URL are required" }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        authorId: session.user.id,
        title: title.trim(),
        description: description?.trim(),
        m3uUrl: m3uUrl.trim(),
        tags: tags ?? [],
        channelCount: channelCount ?? null,
        status: status ?? "PENDING",
        validatedAt: status === "VALID" ? new Date() : null,
      },
    });

    if (status === "VALID") {
      await awardPoints(session.user.id, "playlist_valid");
    }

    return NextResponse.json({ id: playlist.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
