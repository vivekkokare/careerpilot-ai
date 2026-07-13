/**
 * TrackerService — wraps set-status.mjs, merge-tracker.mjs, and reserve-report-num.mjs.
 *
 * These are the canonical write paths for data/applications.md (files-as-canonical doctrine).
 * All status updates MUST go through set-status.mjs, never direct DB writes.
 */

import { execScript, parseJsonOutput, CAREER_OPS_ROOT } from "../../lib/shell";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

export interface SetStatusResult {
  ok: boolean;
  row?: number;
  company?: string;
  role?: string;
  previousStatus?: string;
  newStatus?: string;
  dryRun?: boolean;
  followupSeedCandidate?: boolean;
}

export interface ReservedNum {
  /** Single number, zero-padded (e.g. "042") */
  num: string;
}

export interface ReservedRange {
  /** Range string (e.g. "042-049") */
  range: string;
  /** Individual numbers in the range */
  nums: string[];
}

export class TrackerService {
  /**
   * Update a tracker row's status.
   * @param selector — report number (e.g. "042") or company name
   * @param state — canonical state (Evaluated, Applied, Interview, etc.)
   * @param opts — optional note, role disambiguator, dry-run flag
   */
  async setStatus(
    selector: string,
    state: string,
    opts: { note?: string; role?: string; dryRun?: boolean } = {},
  ): Promise<SetStatusResult> {
    const args = [selector, state, "--json"];
    if (opts.note)   args.push("--note", opts.note);
    if (opts.role)   args.push("--role", opts.role);
    if (opts.dryRun) args.push("--dry-run");

    const result = await execScript("set-status.mjs", args, { allowFailure: true });

    // Exit codes: 0 ok, 1 usage/state error, 2 not found, 3 ambiguous, 4 lock timeout
    if (result.exitCode === 0 || result.exitCode === 0) {
      return parseJsonOutput<SetStatusResult>(result, "set-status.mjs");
    }

    const parsed = result.stdout ? (() => { try { return JSON.parse(result.stdout); } catch { return null; } })() : null;
    throw Object.assign(
      new Error(parsed?.error ?? result.stderr || `set-status exited ${result.exitCode}`),
      { exitCode: result.exitCode, parsed },
    );
  }

  /**
   * Reserve the next report number atomically.
   * Always call this before writing a new report to avoid race conditions (#749).
   */
  async reserveReportNum(): Promise<ReservedNum> {
    const result = await execScript("reserve-report-num.mjs", [], { timeoutMs: 10_000 });
    const num = result.stdout.trim();
    if (!/^\d+$/.test(num)) {
      throw new Error(`Unexpected output from reserve-report-num.mjs: ${num}`);
    }
    return { num: num.padStart(3, "0") };
  }

  /**
   * Reserve a range of report numbers for parallel batch workers.
   * @param count — how many numbers to reserve (2–50)
   */
  async reserveReportRange(count: number): Promise<ReservedRange> {
    const result = await execScript("reserve-report-num.mjs", ["--count", String(count)], { timeoutMs: 15_000 });
    const range = result.stdout.trim();
    if (!/^\d+-\d+$/.test(range)) {
      throw new Error(`Unexpected range output: ${range}`);
    }
    const [from, to] = range.split("-").map(Number);
    const nums: string[] = [];
    for (let i = from; i <= to; i++) nums.push(String(i).padStart(3, "0"));
    return { range, nums };
  }

  /**
   * Release a reserved report number or range (when the real report was written).
   */
  async releaseReportNum(numOrRange: string): Promise<void> {
    await execScript("reserve-report-num.mjs", ["--release", numOrRange], { timeoutMs: 10_000 });
  }

  /**
   * Merge pending TSV additions from batch/tracker-additions/ into data/applications.md.
   * Should be called after any batch of evaluations.
   */
  async mergeTracker(): Promise<{ merged: number }> {
    const result = await execScript("merge-tracker.mjs", ["--json"], { allowFailure: true, timeoutMs: 30_000 });
    if (result.exitCode === 0 && result.stdout) {
      try {
        return parseJsonOutput<{ merged: number }>(result, "merge-tracker.mjs");
      } catch {
        // merge-tracker may not support --json on all versions — treat as success
        return { merged: 0 };
      }
    }
    if (result.exitCode === 0) return { merged: 0 };
    throw new Error(result.stderr || `merge-tracker exited ${result.exitCode}`);
  }

  /**
   * Read the raw applications tracker markdown.
   */
  readTracker(): string {
    const p = join(CAREER_OPS_ROOT, "data", "applications.md");
    if (!existsSync(p)) return "# Applications Tracker\n\n| # | Date | Company | Role | Score | Status | PDF | Report | Notes |\n|---|------|---------|------|-------|--------|-----|--------|-------|\n";
    return readFileSync(p, "utf-8");
  }
}

export const trackerService = new TrackerService();
