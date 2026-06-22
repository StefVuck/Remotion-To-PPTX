import path from "node:path";
import { planScenes } from "./plan.mjs";
import { build } from "./build.mjs";

/**
 * Shared entry point for both the flag-driven CLI and the interactive menu.
 * Resolves the scene plan, runs the render → gif → deck pipeline and logs progress.
 *
 * @param {Object} opts
 * @param {string} opts.project
 * @param {string} [opts.entry]
 * @param {string} [opts.out]
 * @param {string} [opts.workDir]
 * @param {string[]} [opts.only]
 * @param {string[]} [opts.exclude]
 * @param {string} [opts.manifest]   manifest file path
 * @param {number} [opts.fps]
 * @param {number} [opts.width]
 * @param {number} [opts.sourceFps]
 * @returns {Promise<{ out: string, gifs: string[] }>}
 */
export async function run(opts) {
  const projectDir = path.resolve(opts.project);
  const entry = opts.entry ?? "src/index.ts";

  const scenes = await planScenes({
    projectDir,
    entry,
    manifestPath: opts.manifest ? path.resolve(opts.manifest) : undefined,
    only: opts.only,
    exclude: opts.exclude,
    sourceFps: opts.sourceFps,
  });

  console.log(`· ${scenes.length} scene(s): ${scenes.map((s) => s.name).join(", ")}`);

  const started = Date.now();
  const result = await build({
    projectDir,
    entry,
    scenes,
    gif: { fps: opts.fps ?? 15, width: opts.width ?? 1280 },
    out: path.resolve(opts.out ?? "deck.pptx"),
    workDir: path.resolve(opts.workDir ?? ".remotion-deck-build"),
    log: (m) => console.log(`· ${m}`),
  });

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n✓ ${result.gifs.length} slides → ${result.out}  (${secs}s)`);
  return result;
}
