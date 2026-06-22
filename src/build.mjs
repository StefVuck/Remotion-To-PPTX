import path from "node:path";
import { mkdir } from "node:fs/promises";
import { renderScene } from "./render.mjs";
import { framesToGif, probeSize } from "./gif.mjs";
import { buildDeck } from "./pptx.mjs";

/**
 * End-to-end pipeline: render each scene → GIF → assemble a PPTX.
 *
 * @param {Object} args
 * @param {string} args.projectDir   Remotion project root
 * @param {string} args.entry        entry file, relative to projectDir
 * @param {import('./plan.mjs').Scene[]} args.scenes
 * @param {{ fps: number, width: number }} args.gif
 * @param {string} args.out          output .pptx path
 * @param {string} args.workDir      scratch dir for frames + gifs
 * @param {(msg: string) => void} [args.log]
 * @returns {Promise<{ out: string, gifs: string[] }>}
 */
export async function build({ projectDir, entry, scenes, gif, out, workDir, log = () => {} }) {
  const framesRoot = path.join(workDir, "frames");
  const gifsRoot = path.join(workDir, "gifs");
  await mkdir(gifsRoot, { recursive: true });

  const gifs = [];
  const total = scenes.length;

  for (const [i, scene] of scenes.entries()) {
    const idx = String(i + 1).padStart(2, "0");
    const tag = `[${idx}/${total}] ${scene.name}`;

    log(`${tag} · rendering frames`);
    const framesDir = path.join(framesRoot, scene.name);
    await renderScene({ projectDir, entry, composition: scene.composition, scene, outDir: framesDir });

    log(`${tag} · encoding gif`);
    const gifPath = path.join(gifsRoot, `${idx}-${scene.name}.gif`);
    await framesToGif({
      framesDir,
      sourceFps: scene.sourceFps,
      gifFps: gif.fps,
      width: gif.width,
      out: gifPath,
    });

    const size = await probeSize(gifPath);
    gifs.push({ path: gifPath, ...size });
    log(`${tag} · done (${size.width}x${size.height})`);
  }

  log(`assembling ${gifs.length} slides → ${out}`);
  await buildDeck(gifs, out);
  return { out, gifs: gifs.map((g) => g.path) };
}
