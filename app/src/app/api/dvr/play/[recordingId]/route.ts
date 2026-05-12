import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { recordingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recording = await prisma.dvrRecording.findUnique({
    where: { id: params.recordingId },
    include: { schedule: { select: { deviceId: true } } },
  });
  if (!recording) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify access via device → reseller
  const device = await prisma.device.findFirst({
    where: { id: recording.schedule.deviceId, resellerId: session.user.id },
  });
  if (!device) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const storagePath = process.env.STORAGE_PATH || "/storage";
  const filePath = path.join(storagePath, recording.filePath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });
    const nodeReadable = stream as unknown as ReadableStream;

    return new NextResponse(nodeReadable, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "video/mp2t",
      },
    });
  }

  const stream = fs.createReadStream(filePath);
  const nodeReadable = stream as unknown as ReadableStream;

  return new NextResponse(nodeReadable, {
    headers: {
      "Content-Length": fileSize.toString(),
      "Content-Type": "video/mp2t",
      "Accept-Ranges": "bytes",
    },
  });
}
