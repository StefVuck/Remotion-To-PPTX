# remotion-deck

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

Convert any [Remotion](https://www.remotion.dev/) project to PowerPoint: render
each composition to an animated GIF and assemble a blank deck, one GIF per slide.
Zero config — it discovers your compositions automatically.

Remotion only emits a single still per frame or one full video. This tool renders
each composition to a PNG image sequence, converts it to an optimised GIF with
ffmpeg, then drops one GIF per slide into a `.pptx`. PowerPoint plays animated
GIFs during a slideshow, so the deck moves.

```
composition → remotion render --sequence → PNGs → ffmpeg palette → GIF → PPTX slide
```

## Requirements

- Node >= 18
- `ffmpeg` and `ffprobe` on PATH (`brew install ffmpeg`)
- A Remotion project with its dependencies installed (the tool shells out to the
  project's own `npx remotion`, so its version and config are used as-is)

## Install

```bash
npm install
npm link        # optional: exposes the `remotion-deck` command globally
```

## Usage

### Interactive

Run it with no arguments for a guided menu — it asks for the project, discovers
your compositions, lets you pick which to include, and prompts for output
settings:

```bash
remotion-deck
```

### Flags

Point it at a Remotion project. Every registered composition becomes one slide:

```bash
remotion-deck --project ./my-remotion-app --out deck.pptx
# or without npm link:
node bin/cli.mjs --project ./my-remotion-app --out deck.pptx
```

Pick or drop specific compositions:

```bash
remotion-deck -p ./my-remotion-app --only Intro,Demo,Outro
remotion-deck -p ./my-remotion-app --exclude Scratch
```

Tune the GIFs:

```bash
remotion-deck -p ./my-remotion-app --fps 20 --width 1600
```

## Options

| Flag | Default | Description |
|---|---|---|
| `-p, --project <dir>` | — (required) | Remotion project root |
| `-e, --entry <file>` | `src/index.ts` | Remotion entry file, relative to project |
| `-o, --out <file>` | `deck.pptx` | output PowerPoint |
| `-w, --work-dir <dir>` | `.remotion-deck-build` | scratch dir for frames + gifs |
| `--only <ids>` | — | comma-separated composition ids to include |
| `--exclude <ids>` | — | comma-separated composition ids to exclude |
| `-m, --manifest <file>` | — | advanced: slice composition(s) into scenes by frame range |
| `--fps <n>` | `15` | GIF frame rate (downsampled from source) |
| `--width <px>` | `1280` | GIF width; height keeps aspect |
| `--source-fps <n>` | per composition | override the authoring fps |

## Advanced: frame-range slicing

If a single composition holds several scenes as `<Sequence>`s and you want one
slide per scene, supply a manifest. `end` is exclusive (matches a Sequence's
`durationInFrames`); omit it to render to the composition's end. `composition`
can be set per scene or once at the top.

```json
{
  "composition": "Pitch",
  "scenes": [
    { "name": "title", "start": 0, "end": 130 },
    { "name": "problem", "start": 130, "end": 290 },
    { "name": "outro", "start": 290 }
  ]
}
```

```bash
remotion-deck -p ./my-remotion-app -m scenes.json -o deck.pptx
```

## How it's structured (to extend)

- `bin/cli.mjs` — argument parsing + no-arg interactive branch; delegates to `src/run.mjs`.
- `src/interactive.mjs` — the no-argument wizard (`@inquirer/prompts`).
- `src/run.mjs` — shared runner used by both the flag and interactive paths.
- `src/compositions.mjs` — enumerate the project's compositions (`remotion compositions`).
- `src/plan.mjs` — resolve the scene list (compositions by default, or a manifest).
- `src/manifest.mjs` — parse/validate the optional frame-range manifest.
- `src/render.mjs` — one scene → PNG sequence via the project's Remotion CLI.
- `src/gif.mjs` — PNG sequence → GIF (ffmpeg two-pass palette); `probeSize`.
- `src/pptx.mjs` — GIFs → blank deck, slide size matched to the GIF aspect.
- `src/build.mjs` — orchestrates render → gif → deck per scene.
- `src/proc.mjs` — thin `spawn` promise wrapper.

To add a new output format, write a sibling to `pptx.mjs` and branch in
`build.mjs`. To change GIF quality, adjust the ffmpeg filters in `gif.mjs`.

## License

[MIT](LICENSE) © Stefan Vuckovic
