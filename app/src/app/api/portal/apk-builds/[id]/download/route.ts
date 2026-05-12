import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const STORAGE_PATH = process.env.STORAGE_PATH || "/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const build = await prisma.appBuild.findFirst({
    where: {
      id,
      resellerId: session.user.id,
      status: "SUCCESS",
    },
  });

  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  const apkPath = path.join(STORAGE_PATH, "uploads", `${id}.apk`);

  if (!fs.existsSync(apkPath)) {
    return NextResponse.json({ error: "APK file not found" }, { status: 404 });
  }

  const stat = fs.statSync(apkPath);
  const fileStream = fs.createReadStream(apkPath);

  const readableStream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      fileStream.on("end", () => {
        controller.close();
      });
      fileStream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      fileStream.destroy();
    },
  });

  const safeAppName = build.appName.replace(/[^a-zA-Z0-9_\- ]/g, "_");

  return new NextResponse(readableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="${safeAppName}.apk"`,
      "Content-Length": stat.size.toString(),
    },
  });
}
