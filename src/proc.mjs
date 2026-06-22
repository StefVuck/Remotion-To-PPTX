import { spawn } from "node:child_process";

/**
 * Run a command, streaming stderr through and capturing stdout.
 * Rejects on a non-zero exit code.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, quiet?: boolean }} [opts]
 * @returns {Promise<string>} captured stdout
 */
export function run(cmd, args, opts = {}) {
  const { cwd, quiet = false } = opts;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
      if (!quiet) process.stderr.write(d);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(stdout);
      reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}\n${stderr}`));
    });
  });
}
