import { NextRequest, NextResponse } from "next/server";
import { validateM3U } from "@/lib/m3u-validator";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const result = await validateM3U(url);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ valid: false, channelCount: 0, errors: ["Validation failed"] });
  }
}
