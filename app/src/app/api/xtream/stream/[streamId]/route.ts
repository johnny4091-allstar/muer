import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getXtreamClient } from "@/lib/xtream";

export async function GET(
  req: NextRequest,
  { params }: { params: { streamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "live") as "live" | "vod" | "series";
  const ext = searchParams.get("ext") || "ts";

  const client = await getXtreamClient(session.user.id);
  if (!client) return NextResponse.json({ error: "Xtream not configured" }, { status: 503 });

  const streamId = parseInt(params.streamId);
  let url: string;

  switch (type) {
    case "vod":
      url = client.buildVodStreamUrl(streamId, ext);
      break;
    case "series":
      url = client.buildSeriesStreamUrl(streamId, ext);
      break;
    default:
      url = client.buildLiveStreamUrl(streamId, ext);
  }

  // Return redirect — never proxy live video bytes through Next.js
  return NextResponse.redirect(url, { status: 302 });
}
