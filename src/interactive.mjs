import { input, checkbox, number, confirm } from "@inquirer/prompts";
import { listCompositions } from "./compositions.mjs";

/**
 * Interactive wizard used when the CLI is run with no arguments. Walks the user
 * through project → compositions → output settings, then returns an options
 * object compatible with `run()`.
 *
 * @returns {Promise<object|null>} options for `run()`, or null if cancelled
 */
export async function promptOptions() {
  console.log("remotion-deck — interactive setup\n");

  const project = await input({
    message: "Remotion project directory:",
    default: ".",
  });

  // Re-prompt the entry file until compositions can be enumerated.
  let entry = "src/index.ts";
  let comps;
  for (;;) {
    entry = await input({ message: "Entry file (relative to project):", default: entry });
    try {
      process.stdout.write("· discovering compositions…\n");
      comps = await listCompositions({ projectDir: project, entry });
      break;
    } catch (err) {
      console.error(`  ✗ ${err.message}\n`);
      const retry = await confirm({ message: "Try a different entry file?", default: true });
      if (!retry) return null;
    }
  }

  const only = await checkbox({
    message: "Compositions to include (one slide each):",
    required: true,
    choices: comps.map((c) => ({
      name: `${c.id}  (${c.frames}f · ${c.width}x${c.height} · ${c.fps}fps)`,
      value: c.id,
      checked: true,
    })),
  });

  const width = await number({ message: "GIF width (px):", default: 1280, min: 1 });
  const fps = await number({ message: "GIF frame rate:", default: 15, min: 1 });
  const out = await input({ message: "Output .pptx path:", default: "deck.pptx" });

  console.log(
    `\nReady: ${only.length} slide(s) from ${entry} → ${out} (${width}px, ${fps}fps)`,
  );
  const go = await confirm({ message: "Build now?", default: true });
  if (!go) return null;

  return { project, entry, only, width, fps, out };
}
