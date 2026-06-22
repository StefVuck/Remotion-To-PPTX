import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { run } from "./proc.mjs";
import { describeSequence } from "./render.mjs";

/**
 * Convert a PNG image sequence into a single optimised GIF using ffmpeg's
 * two-pass palette workflow (palettegen + paletteuse) for clean colours.
 *
 * @param {Object} args
 * @param {string} args.framesDir   directory holding element-<frame>.png
 * @param {number} args.sourceFps   fps the frames represent
 * @param {number} args.gifFps      target GIF frame rate (downsampled)
 * @param {number} args.width       target GIF width in px (height auto, keeps aspect)
 * @param {string} args.out         output .gif path
 * @returns {Promise<string>} out
 */
export async function framesToGif({ framesDir, sourceFps, gifFps, width, out }) {
  await mkdir(path.dirname(out), { recursive: true });
  const palette = path.join(os.tmpdir(), `palette-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  const { pattern, start } = await describeSequence(framesDir);
  // scale width must stay even for most encoders; -2 keeps aspect and evenness.
  const filters = `fps=${gifFps},scale=${width}:-2:flags=lanczos`;

  const input = ["-framerate", String(sourceFps), "-start_number", String(start), "-i", pattern];

  try {
    await run(
      "ffmpeg",
      ["-y", ...input, "-vf", `${filters},palettegen=stats_mode=diff`, palette],
      { quiet: true },
    );
    await run(
      "ffmpeg",
      [
        "-y",
        ...input,
        "-i",
        palette,
        "-lavfi",
        `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
        "-loop",
        "0",
        out,
      ],
      { quiet: true },
    );
  } finally {
    await rm(palette, { force: true });
  }
  return out;
}

/**
 * Read the pixel dimensions of a media file via ffprobe.
 *
 * @param {string} file
 * @returns {Promise<{ width: number, height: number }>}
 */
export async function probeSize(file) {
  const out = await run(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file],
    { quiet: true },
  );
  const [width, height] = out.trim().split(",").map(Number);
  return { width, height };
}
