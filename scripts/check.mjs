// Pre-publish guard: syntax-check every shipped module with `node --check` so a
// broken file can never be published. Pure parse check — nothing is executed.
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const files = [
  path.join(root, "bin/cli.mjs"),
  ...(await readdir(path.join(root, "src")))
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => path.join(root, "src", f)),
];

let failed = 0;
for (const file of files) {
  const { status, stderr } = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  const rel = path.relative(root, file);
  if (status === 0) {
    console.log(`  ok  ${rel}`);
  } else {
    failed++;
    console.error(`  ✗   ${rel}\n${stderr}`);
  }
}

if (failed > 0) {
  console.error(`\n✗ ${failed} file(s) failed the syntax check — publish aborted.`);
  process.exit(1);
}
console.log(`\n✓ ${files.length} files passed.`);
