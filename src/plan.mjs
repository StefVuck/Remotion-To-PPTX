import { listCompositions, filterCompositions } from "./compositions.mjs";
import { loadManifest, slug } from "./manifest.mjs";

/**
 * @typedef {Object} Scene
 * @property {string} name        output slug + slide order
 * @property {string} composition composition id to render
 * @property {number} start       first frame, inclusive
 * @property {number} [end]       one past last frame; whole composition if omitted
 * @property {number} sourceFps   composition's authoring fps (for correct GIF timing)
 */

/**
 * Resolve the list of scenes to render. Always enumerates the project's
 * compositions so it can validate ids and fill in each scene's source fps,
 * then either maps each composition to one scene (default) or applies a
 * manifest's frame-range slicing.
 *
 * @param {Object} args
 * @param {string} args.projectDir
 * @param {string} args.entry
 * @param {string} [args.manifestPath]
 * @param {string[]} [args.only]      composition ids to include (default mode)
 * @param {string[]} [args.exclude]   composition ids to exclude (default mode)
 * @param {number} [args.sourceFps]   override fps for all scenes
 * @returns {Promise<Scene[]>}
 */
export async function planScenes({ projectDir, entry, manifestPath, only, exclude, sourceFps }) {
  const comps = await listCompositions({ projectDir, entry });
  const fpsOf = new Map(comps.map((c) => [c.id, c.fps]));

  if (manifestPath) {
    const manifest = await loadManifest(manifestPath);
    return manifest.scenes.map((s) => {
      const fps = sourceFps ?? fpsOf.get(s.composition);
      if (fps == null) throw new Error(`manifest scene "${s.name}": unknown composition "${s.composition}"`);
      return { ...s, sourceFps: fps };
    });
  }

  // Default, config-free: one composition = one scene = one slide.
  return filterCompositions(comps, { only, exclude }).map((c) => ({
    name: slug(c.id),
    composition: c.id,
    start: 0,
    end: undefined,
    sourceFps: sourceFps ?? c.fps,
  }));
}
