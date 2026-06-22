import { run } from "./proc.mjs";

/**
 * @typedef {Object} Composition
 * @property {string} id
 * @property {number} fps
 * @property {number} width
 * @property {number} height
 * @property {number} frames  total duration in frames
 */

/**
 * Enumerate every composition registered by a Remotion project by shelling out
 * to its own `remotion compositions`. This is the general contract: one
 * composition = one scene = one slide, with no project-specific config.
 *
 * @param {Object} args
 * @param {string} args.projectDir
 * @param {string} args.entry  entry file, relative to projectDir
 * @returns {Promise<Composition[]>}
 */
export async function listCompositions({ projectDir, entry }) {
  const stdout = await run("npx", ["--no-install", "remotion", "compositions", entry], {
    cwd: projectDir,
    quiet: true,
  });

  // Table rows look like: `Pitch    30    1920x1080    3934 (131.13 sec)`
  const rowRe = /^(\S+)\s+(\d+)\s+(\d+)x(\d+)\s+(\d+)\b/;
  const comps = [];
  for (const line of stdout.split("\n")) {
    const m = line.trim().match(rowRe);
    if (!m) continue;
    comps.push({
      id: m[1],
      fps: Number(m[2]),
      width: Number(m[3]),
      height: Number(m[4]),
      frames: Number(m[5]),
    });
  }

  if (comps.length === 0) {
    throw new Error(`no compositions found via \`remotion compositions ${entry}\``);
  }
  return comps;
}

/**
 * Apply --only / --exclude id filters (exact match), preserving project order.
 *
 * @param {Composition[]} comps
 * @param {{ only?: string[], exclude?: string[] }} filters
 * @returns {Composition[]}
 */
export function filterCompositions(comps, { only, exclude } = {}) {
  let out = comps;
  if (only?.length) {
    const set = new Set(only);
    out = out.filter((c) => set.has(c.id));
    const missing = only.filter((id) => !comps.some((c) => c.id === id));
    if (missing.length) throw new Error(`--only: unknown composition(s): ${missing.join(", ")}`);
  }
  if (exclude?.length) {
    const set = new Set(exclude);
    out = out.filter((c) => !set.has(c.id));
  }
  if (out.length === 0) throw new Error("no compositions left after filtering");
  return out;
}
