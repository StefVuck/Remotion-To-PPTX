import { mkdir, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { run } from "./proc.mjs";

/**
 * Render one scene of a Remotion composition to a PNG image sequence.
 *
 * Files land as `element-<frame>.png` (absolute frame numbers) in `outDir`.
 * Shells out to the project's own Remotion CLI so the installed version and
 * remotion.config are used verbatim.
 *
 * @param {Object} args
 * @param {string} args.projectDir  Remotion project root
 * @param {string} args.entry       entry file, relative to projectDir
 * @param {string} args.composition composition id
 * @param {import('./manifest.mjs').Scene} args.scene
 * @param {string} args.outDir      directory for the frame sequence
 * @returns {Promise<string>} outDir
 */
export async function renderScene({ projectDir, entry, composition, scene, outDir }) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const args = [
    "--no-install",
    "remotion",
    "render",
    entry,
    composition,
    outDir,
    "--sequence",
    "--image-format=png",
    "--log=error",
  ];
  // Remotion --frames is inclusive on both ends; our scene.end is exclusive.
  if (scene.end != null) args.push(`--frames=${scene.start}-${scene.end - 1}`);

  await run("npx", args, { cwd: projectDir });
  return outDir;
}

/**
 * Inspect a rendered sequence directory and derive the ffmpeg input pattern.
 * Remotion names frames `element-<n>.png`, zero-padded to the width of the
 * largest index in the range, so the pad width is detected rather than assumed.
 *
 * @param {string} dir
 * @returns {Promise<{ pattern: string, start: number, count: number }>}
 */
export async function describeSequence(dir) {
  const files = (await readdir(dir))
    .map((f) => /^element-(\d+)\.png$/.exec(f))
    .filter(Boolean);
  if (files.length === 0) throw new Error(`no rendered frames found in ${dir}`);

  const numbers = files.map((m) => Number(m[1]));
  const padWidth = files[0][1].length; // uniform within a single render
  return {
    pattern: path.join(dir, `element-%0${padWidth}d.png`),
    start: Math.min(...numbers),
    count: numbers.length,
  };
}
