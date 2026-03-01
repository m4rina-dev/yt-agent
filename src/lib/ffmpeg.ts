import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

const TMP_DIR = path.join(process.cwd(), "tmp");

export async function ensureTmpDir(): Promise<string> {
  await fs.mkdir(TMP_DIR, { recursive: true });
  return TMP_DIR;
}

export async function checkFfmpeg(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

export async function getVideoDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

export async function resizeClip(
  inputPath: string,
  outputPath: string,
  duration: number
): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-i",
    inputPath,
    "-t",
    duration.toString(),
    "-vf",
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-an",
    "-y",
    outputPath,
  ]);
}

export { TMP_DIR };
