import { run } from "./proc.mjs";

const INSTALL = {
  darwin: "  macOS:    brew install ffmpeg",
  linux: "  Linux:    sudo apt install ffmpeg   (or your distro's package manager)",
  win32: "  Windows:  winget install Gyan.FFmpeg   (or: choco install ffmpeg / scoop install ffmpeg)",
};

/**
 * Verify ffmpeg and ffprobe are on PATH before doing any work, failing early
 * with platform-specific install instructions instead of a cryptic spawn error
 * mid-render.
 *
 * @returns {Promise<void>}
 * @throws {Error} if either binary is missing
 */
export async function ensureFfmpeg() {
  const missing = [];
  for (const bin of ["ffmpeg", "ffprobe"]) {
    try {
      await run(bin, ["-version"], { quiet: true });
    } catch {
      missing.push(bin);
    }
  }
  if (missing.length === 0) return;

  const hint = INSTALL[process.platform] ?? `  See https://ffmpeg.org/download.html`;
  throw new Error(
    `${missing.join(" and ")} not found on PATH — required for GIF conversion.\n` +
      `Install ffmpeg (it provides both):\n${hint}\n` +
      `  Other:    https://ffmpeg.org/download.html`,
  );
}
