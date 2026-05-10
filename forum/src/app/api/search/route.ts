import { NextRequest, NextResponse } from "next/server";
import { searchThreads, searchPosts, searchUsers } from "@/lib/search";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "threads";
  const page = parseInt(searchParams.get("page") ?? "1");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], total: 0 });
  }

  let results;
  if (type === "posts") {
    results = await searchPosts(q, page);
  } else if (type === "users") {
    results = await searchUsers(q);
  } else {
    results = await searchThreads(q, page);
  }

  return NextResponse.json({ results, query: q, type });
}
