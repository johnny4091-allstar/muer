import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const ANDROID_TEMPLATE = "/android-template";
const STORAGE_PATH = process.env.STORAGE_PATH || "/storage";
const PORTAL_URL = process.env.PORTAL_URL || "http://localhost:3000";
const ANDROID_HOME = process.env.ANDROID_HOME || "/opt/android-sdk";

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30) || "iptvapp";
}

function ensureColorHash(color: string): string {
  if (color.startsWith("#")) return color;
  return "#" + color;
}

function replaceInFile(filePath: string, replacements: Record<string, string>): void {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (content.includes(placeholder)) {
      content = content.split(placeholder).join(value);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
  }
}

function replaceInDirectory(dir: string, replacements: Record<string, string>): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDirectory(fullPath, replacements);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".kt") ||
        entry.name.endsWith(".xml") ||
        entry.name.endsWith(".gradle") ||
        entry.name.endsWith(".properties") ||
        entry.name.endsWith(".json"))
    ) {
      replaceInFile(fullPath, replacements);
    }
  }
}

async function copyLogo(logoPath: string, tempDir: string): Promise<void> {
  const srcFile = path.join(STORAGE_PATH, "uploads", logoPath);
  if (!fs.existsSync(srcFile)) return;

  const densities = ["mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"];
  for (const density of densities) {
    const destDir = path.join(tempDir, "app", "src", "main", "res", density);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcFile, path.join(destDir, "ic_launcher.png"));
  }
}

async function generateKeystore(tempDir: string): Promise<void> {
  const keystorePath = path.join(tempDir, "release.keystore");
  const cmd = [
    "keytool -genkey -v",
    `-keystore "${keystorePath}"`,
    `-alias release`,
    `-keyalg RSA`,
    `-keysize 2048`,
    `-validity 10000`,
    `-noprompt`,
    `-dname "CN=IPTVSaaS, O=App, C=US"`,
    `-storepass iptvsaas123`,
    `-keypass iptvsaas123`,
  ].join(" ");

  await execAsync(cmd);
  console.log(`[Builder] Keystore generated at ${keystorePath}`);
}

async function runGradleBuild(tempDir: string): Promise<string> {
  const env = {
    ...process.env,
    ANDROID_HOME,
    JAVA_HOME: process.env.JAVA_HOME || "",
  };

  console.log(`[Builder] Running gradle assembleRelease in ${tempDir}`);
  const { stdout, stderr } = await execAsync("gradle assembleRelease", {
    cwd: tempDir,
    env,
    timeout: 10 * 60 * 1000, // 10 minutes
    maxBuffer: 50 * 1024 * 1024, // 50MB
  });

  return stdout + "\n" + stderr;
}

async function processBuild(buildId: string): Promise<void> {
  const build = await prisma.appBuild.findUnique({ where: { id: buildId } });
  if (!build) {
    console.error(`[Builder] Build ${buildId} not found`);
    return;
  }

  const tempDir = `/tmp/build-${buildId}`;

  console.log(`[Builder] Starting build ${buildId} for app "${build.appName}"`);

  // Mark as BUILDING
  await prisma.appBuild.update({
    where: { id: buildId },
    data: { status: "BUILDING" },
  });

  try {
    // Create temp dir and copy template
    fs.mkdirSync(tempDir, { recursive: true });
    fs.cpSync(ANDROID_TEMPLATE, tempDir, { recursive: true });
    console.log(`[Builder] Template copied to ${tempDir}`);

    // Prepare replacements
    const sanitized = sanitizeName(build.appName);
    const packageName = `com.${sanitized}.player`;
    const primaryColor = ensureColorHash(build.primaryColor);
    const accentColor = ensureColorHash(build.accentColor);

    const replacements: Record<string, string> = {
      "{{APP_NAME}}": build.appName,
      "{{APP_NAME_SAFE}}": sanitized,
      "{{PACKAGE_NAME}}": packageName,
      "{{PRIMARY_COLOR}}": primaryColor,
      "{{ACCENT_COLOR}}": accentColor,
      "{{PORTAL_URL}}": PORTAL_URL,
    };

    // Replace placeholders in all files
    replaceInDirectory(tempDir, replacements);
    console.log(`[Builder] Placeholders replaced`);

    // Copy logo if available
    if (build.logoPath) {
      await copyLogo(build.logoPath, tempDir);
      console.log(`[Builder] Logo copied`);
    }

    // Generate keystore
    await generateKeystore(tempDir);

    // Run Gradle build
    const buildLog = await runGradleBuild(tempDir);
    console.log(`[Builder] Gradle build completed`);

    // Copy output APK to storage
    const apkSource = path.join(tempDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
    const uploadsDir = path.join(STORAGE_PATH, "uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });
    const apkDest = path.join(uploadsDir, `${buildId}.apk`);
    fs.copyFileSync(apkSource, apkDest);
    console.log(`[Builder] APK copied to ${apkDest}`);

    // Update build as SUCCESS
    await prisma.appBuild.update({
      where: { id: buildId },
      data: {
        status: "SUCCESS",
        downloadUrl: `/api/portal/apk-builds/${buildId}/download`,
        buildLog: buildLog.slice(0, 10000), // truncate to 10k chars
        completedAt: new Date(),
      },
    });

    console.log(`[Builder] Build ${buildId} completed successfully`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Builder] Build ${buildId} failed:`, errorMessage);

    await prisma.appBuild.update({
      where: { id: buildId },
      data: {
        status: "FAILED",
        buildLog: errorMessage.slice(0, 10000),
        completedAt: new Date(),
      },
    });
  } finally {
    // Cleanup temp dir
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`[Builder] Cleaned up ${tempDir}`);
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function pollForBuilds(): Promise<void> {
  console.log("[Builder] Polling for queued builds...");

  const queuedBuilds = await prisma.appBuild.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  if (queuedBuilds.length === 0) {
    return;
  }

  const build = queuedBuilds[0];
  await processBuild(build.id);
}

async function run(): Promise<void> {
  console.log("[Builder] APK Build Worker started");
  console.log(`[Builder] Android template: ${ANDROID_TEMPLATE}`);
  console.log(`[Builder] Storage path: ${STORAGE_PATH}`);
  console.log(`[Builder] Portal URL: ${PORTAL_URL}`);

  // Check template exists
  if (!fs.existsSync(ANDROID_TEMPLATE)) {
    console.error(`[Builder] Android template not found at ${ANDROID_TEMPLATE}`);
    console.error("[Builder] Make sure the android-template volume is mounted correctly");
  }

  while (true) {
    try {
      await pollForBuilds();
    } catch (err) {
      console.error("[Builder] Poll error:", err);
    }
    await new Promise((r) => setTimeout(r, 10000)); // Poll every 10 seconds
  }
}

run().catch((err) => {
  console.error("[Builder] Fatal error:", err);
  process.exit(1);
});
