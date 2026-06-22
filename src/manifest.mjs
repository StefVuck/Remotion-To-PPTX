import { readFile } from "node:fs/promises";

/**
 * Optional manifest, for the advanced case of slicing a single composition into
 * several scenes by frame range (e.g. a pitch built as Sequences inside one
 * composition). The default, config-free mode does not need this — see
 * `plan.mjs`.
 *
 * @typedef {Object} ManifestScene
 * @property {string} name          output slug + slide order
 * @property {string} [composition] composition id (defaults to manifest.composition)
 * @property {number} [start]       first frame, inclusive (default 0)
 * @property {number} [end]         one past the last frame (Sequence semantics); whole comp if omitted
 *
 * @typedef {Object} Manifest
 * @property {string} [composition] default composition id for scenes
 * @property {string} [entry]
 * @property {ManifestScene[]} scenes
 */

/** @param {string} path @returns {Promise<Manifest>} */
export async function loadManifest(path) {
  const m = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(m.scenes) || m.scenes.length === 0) {
    throw new Error("manifest: `scenes` must be a non-empty array");
  }
  m.scenes = m.scenes.map((s, i) => {
    if (!s.name) throw new Error(`manifest: scene #${i} is missing a name`);
    const composition = s.composition ?? m.composition;
    if (!composition) {
      throw new Error(`manifest: scene "${s.name}" has no composition (set scene.composition or top-level composition)`);
    }
    const start = s.start ?? 0;
    if (!Number.isInteger(start) || start < 0) {
      throw new Error(`manifest: scene "${s.name}" has an invalid start frame`);
    }
    if (s.end != null && (!Number.isInteger(s.end) || s.end <= start)) {
      throw new Error(`manifest: scene "${s.name}" has an invalid end frame`);
    }
    return { name: slug(s.name), composition, start, end: s.end };
  });
  return m;
}

export function slug(s) {
  return String(s)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
