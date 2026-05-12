import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getXtreamClient } from "@/lib/xtream";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category") || undefined;

  const client = await getXtreamClient(session.user.id);
  if (!client) {
    return NextResponse.json({ error: "Xtream not configured" }, { status: 503 });
  }

  const [categories, channels] = await Promise.all([
    client.getLiveCategories(),
    client.getLiveChannels(categoryId),
  ]);

  return NextResponse.json({ categories, channels });
}
