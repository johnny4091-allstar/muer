import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export interface RecorderOptions {
  streamUrl: string;
  outputPath: string;
  durationSec: number;
  onProgress?: (progress: { percent: number; elapsed: number }) => void;
  onComplete?: (sizeBytes: number) => void;
  onError?: (err: Error) => void;
}

export function startRecording(opts: RecorderOptions): () => void {
  const dir = path.dirname(opts.outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const args = [
    "-hide_banner",
    "-loglevel", "error",
    "-i", opts.streamUrl,
    "-c", "copy",
    "-t", String(opts.durationSec),
    "-y",
    opts.outputPath,
  ];

  const ffmpeg = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

  const startTime = Date.now();

  ffmpeg.stderr.on("data", (data: Buffer) => {
    const line = data.toString();
    // Parse "time=HH:MM:SS.ms" from ffmpeg stderr
    const match = line.match(/time=(\d+):(\d+):(\d+\.?\d*)/);
    if (match && opts.onProgress) {
      const elapsed =
        parseInt(match[1]) * 3600 +
        parseInt(match[2]) * 60 +
        parseFloat(match[3]);
      const percent = Math.min(100, (elapsed / opts.durationSec) * 100);
      opts.onProgress({ percent, elapsed });
    }
  });

  ffmpeg.on("close", (code) => {
    if (code === 0) {
      const sizeBytes = fs.existsSync(opts.outputPath)
        ? fs.statSync(opts.outputPath).size
        : 0;
      opts.onComplete?.(sizeBytes);
    } else if (code !== null) {
      opts.onError?.(new Error(`FFmpeg exited with code ${code}`));
    }
  });

  ffmpeg.on("error", (err) => {
    opts.onError?.(err);
  });

  // Return stop function
  return () => {
    ffmpeg.kill("SIGTERM");
  };
}
