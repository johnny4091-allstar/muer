import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEpgForChannel, getCurrentProgram } from "@/lib/epg";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const current = searchParams.get("current") === "true";

  if (!channelId) return NextResponse.json({ error: "Missing channelId" }, { status: 400 });

  if (current) {
    const program = await getCurrentProgram(channelId, session.user.id);
    return NextResponse.json({ program });
  }

  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const programs = await getEpgForChannel(channelId, session.user.id, from, to);
  return NextResponse.json({ programs });
}
