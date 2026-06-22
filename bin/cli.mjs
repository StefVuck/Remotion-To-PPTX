#!/usr/bin/env node
import { Command } from "commander";
import { run } from "../src/run.mjs";
import { promptOptions } from "../src/interactive.mjs";

// No arguments → interactive wizard (only if we have a real terminal to read
// from; otherwise fall through to commander, which prints help and errors on
// the missing required --project).
if (process.argv.length <= 2 && process.stdin.isTTY) {
  const opts = await promptOptions().catch((err) => {
    // Ctrl-C / Esc from @inquirer throws; treat as a clean cancel.
    if (err?.name === "ExitPromptError") return null;
    throw err;
  });
  if (!opts) {
    console.log("cancelled.");
    process.exit(0);
  }
  await run(opts);
  process.exit(0);
}

const program = new Command();

program
  .name("remotion-deck")
  .description(
    "Convert a Remotion project to PowerPoint: render each composition to an animated GIF and assemble a blank deck, one GIF per slide. Run with no arguments for an interactive menu.",
  )
  .requiredOption("-p, --project <dir>", "path to the Remotion project root")
  .option("-e, --entry <file>", "Remotion entry file, relative to project", "src/index.ts")
  .option("-o, --out <file>", "output .pptx path", "deck.pptx")
  .option("-w, --work-dir <dir>", "scratch directory for frames/gifs", ".remotion-deck-build")
  .option("--only <ids>", "comma-separated composition ids to include", list)
  .option("--exclude <ids>", "comma-separated composition ids to exclude", list)
  .option("-m, --manifest <file>", "advanced: slice composition(s) into scenes by frame range")
  .option("--fps <n>", "GIF frame rate", toInt, 15)
  .option("--width <px>", "GIF width in px (height keeps aspect)", toInt, 1280)
  .option("--source-fps <n>", "override the composition authoring fps", toInt)
  .action((opts) =>
    run({
      project: opts.project,
      entry: opts.entry,
      out: opts.out,
      workDir: opts.workDir,
      only: opts.only,
      exclude: opts.exclude,
      manifest: opts.manifest,
      fps: opts.fps,
      width: opts.width,
      sourceFps: opts.sourceFps,
    }),
  );

program.parseAsync(process.argv).catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});

function toInt(v) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`expected an integer, got "${v}"`);
  return n;
}

function list(v) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
