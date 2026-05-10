import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });

  const isAvatar = type === "avatar";
  const subDir = isAvatar ? "avatars" : "attachments";
  const dir = join(UPLOAD_DIR, subDir);
  await mkdir(dir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = isAvatar ? "webp" : file.name.split(".").pop() ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(dir, filename);

  if (isAvatar) {
    await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(filepath);
  } else {
    await writeFile(filepath, buffer);
  }

  const url = `/uploads/${subDir}/${filename}`;
  return NextResponse.json({ url }, { status: 201 });
}
