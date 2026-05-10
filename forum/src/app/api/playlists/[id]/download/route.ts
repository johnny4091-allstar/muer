import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const { id } = await params;

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.playlist.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  if (playlist.m3uUrl) {
    return NextResponse.redirect(playlist.m3uUrl);
  }

  if (playlist.m3uFilePath) {
    const fs = await import("fs/promises");
    try {
      const file = await fs.readFile(playlist.m3uFilePath);
      return new NextResponse(file, {
        headers: {
          "Content-Type": "application/x-mpegURL",
          "Content-Disposition": `attachment; filename="${playlist.title.replace(/[^a-z0-9]/gi, "_")}.m3u"`,
        },
      });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ error: "No file or URL available" }, { status: 404 });
}
