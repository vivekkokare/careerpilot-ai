/**
 * shell.ts — thin wrapper around child_process.spawn for running career-ops .mjs scripts.
 *
 * All integration services shell out to existing .mjs scripts in CAREER_OPS_ROOT rather
 * than reimplementing their logic. This preserves upstream compatibility and means the
 * web API benefits from every improvement made to the CLI scripts automatically.
 */

import { spawn } from "child_process";
import { resolve, join } from "path";
import { logger } from "./logger";

/** Root of the career-ops project — the .mjs scripts live here. */
export const CAREER_OPS_ROOT = resolve(__dirname, "..", "..", "..", "..");

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class ShellError extends Error {
  constructor(
    message: string,
    public readonly result: ShellResult,
    public readonly script: string,
  ) {
    super(message);
    this.name = "ShellError";
  }
}

export interface ExecOptions {
  /** Working directory — defaults to CAREER_OPS_ROOT */
  cwd?: string;
  /** Environment variables merged onto process.env */
  env?: Record<string, string>;
  /** Timeout in ms — defaults to 120_000 (2 min) */
  timeoutMs?: number;
  /** If true, non-zero exit is not thrown — caller checks exitCode */
  allowFailure?: boolean;
}

/**
 * Run `node <script> [...args]` in CAREER_OPS_ROOT.
 * Resolves to { stdout, stderr, exitCode }.
 * Throws ShellError on non-zero exit unless allowFailure is true.
 */
export function execScript(
  scriptName: string,
  args: string[] = [],
  opts: ExecOptions = {},
): Promise<ShellResult> {
  const scriptPath = join(CAREER_OPS_ROOT, scriptName);
  const cwd        = opts.cwd ?? CAREER_OPS_ROOT;
  const timeoutMs  = opts.timeoutMs ?? 120_000;
  const env        = { ...process.env, ...(opts.env ?? {}) } as NodeJS.ProcessEnv;

  logger.debug("shell.exec", { script: scriptName, args, cwd });

  return new Promise((resolve, reject) => {
    const chunks = { out: [] as Buffer[], err: [] as Buffer[] };
    let timedOut  = false;

    const proc = spawn("node", [scriptPath, ...args], { cwd, env, stdio: "pipe" });

    proc.stdout.on("data", (d: Buffer) => chunks.out.push(d));
    proc.stderr.on("data", (d: Buffer) => chunks.err.push(d));

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      const stdout   = Buffer.concat(chunks.out).toString("utf-8").trim();
      const stderr   = Buffer.concat(chunks.err).toString("utf-8").trim();
      const exitCode = code ?? 1;
      const result: ShellResult = { stdout, stderr, exitCode };

      if (timedOut) {
        return reject(new ShellError(`Script timed out after ${timeoutMs}ms`, result, scriptName));
      }

      if (exitCode !== 0 && !opts.allowFailure) {
        logger.warn("shell.nonzero", { script: scriptName, exitCode, stderr: stderr.slice(0, 500) });
        return reject(new ShellError(`Script exited with code ${exitCode}`, result, scriptName));
      }

      logger.debug("shell.done", { script: scriptName, exitCode });
      resolve(result);
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new ShellError(`Failed to spawn script: ${err.message}`, { stdout: "", stderr: err.message, exitCode: -1 }, scriptName));
    });
  });
}

/** Parse JSON from stdout, throw if invalid. */
export function parseJsonOutput<T>(result: ShellResult, script: string): T {
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    throw new ShellError(`Script did not produce valid JSON: ${result.stdout.slice(0, 200)}`, result, script);
  }
}
