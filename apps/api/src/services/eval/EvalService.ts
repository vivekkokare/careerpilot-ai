/**
 * EvalService — wraps the career-ops evaluation engine.
 *
 * career-ops evaluations are driven by AI modes (modes/oferta.md + modes/_shared.md).
 * For direct API-triggered evaluation, we use the provider-specific eval scripts
 * (gemini-eval.mjs, openai-eval.mjs, ollama-eval.mjs) which already load the mode
 * files and cv.md internally.
 *
 * The Claude-based evaluation (the primary path) runs through the skill itself and
 * is not scriptable as a CLI — that flow goes through the agent UI. This service
 * exposes the headless provider scripts for queue-based / automated use.
 *
 * Files-as-canonical: reports are written to reports/ and tracker additions to
 * batch/tracker-additions/ by the scripts; this service surfaces their output.
 */

import { execScript, parseJsonOutput } from "../../lib/shell";
import { CAREER_OPS_ROOT } from "../../lib/shell";
import { join } from "path";
import { writeFileSync, mkdirSync, unlinkSync } from "fs";
import { randomUUID } from "crypto";

export type EvalProvider = "gemini" | "openai" | "ollama" | "openrouter";

export interface EvalRequest {
  /** Full JD text (mutually exclusive with jdFile) */
  jdText?: string;
  /** Absolute path to a JD file (mutually exclusive with jdText) */
  jdFile?: string;
  /** Preferred provider — defaults to gemini (free tier) */
  provider?: EvalProvider;
  /** Override model name */
  model?: string;
  /** Pre-reserved report number (from reserve-report-num.mjs) */
  reportNum?: string;
}

export interface EvalResult {
  reportNum: string;
  reportPath: string;
  score?: number;
  company?: string;
  role?: string;
  /** Raw stdout from the eval script */
  raw: string;
}

const PROVIDER_SCRIPTS: Record<EvalProvider, string> = {
  gemini:     "gemini-eval.mjs",
  openai:     "openai-eval.mjs",
  ollama:     "ollama-eval.mjs",
  openrouter: "openrouter-runner.mjs",
};

export class EvalService {
  /**
   * Run a headless evaluation using a provider script.
   * Returns the report number and path after the script writes the report.
   */
  async evaluate(req: EvalRequest): Promise<EvalResult> {
    if (!req.jdText && !req.jdFile) {
      throw new Error("Either jdText or jdFile is required");
    }

    const provider = req.provider ?? "gemini";
    const script   = PROVIDER_SCRIPTS[provider];

    if (!script) {
      throw new Error(`Unknown eval provider: ${provider}`);
    }

    // Write JD to a temp file if jdText provided
    let tmpJdPath: string | null = null;
    if (req.jdText) {
      const jdsDir = join(CAREER_OPS_ROOT, "jds");
      mkdirSync(jdsDir, { recursive: true });
      tmpJdPath = join(jdsDir, `.jd-api-${randomUUID()}.txt`);
      writeFileSync(tmpJdPath, req.jdText, "utf-8");
    }

    const jdPath = tmpJdPath ?? req.jdFile!;

    const args = ["--file", jdPath];
    if (req.model)     args.push("--model", req.model);
    if (req.reportNum) args.push("--report", req.reportNum);

    try {
      const result = await execScript(script, args, { timeoutMs: 180_000 });

      // The scripts print the report path to stdout — extract it
      const reportPathMatch = result.stdout.match(/Report:\s*(.+\.md)/i)
                           ?? result.stdout.match(/reports\/(\d{3}-[^\s]+\.md)/);
      const reportPath = reportPathMatch
        ? join(CAREER_OPS_ROOT, reportPathMatch[1].trim())
        : "";

      const numMatch = result.stdout.match(/Report #?(\d{3})/i)
                    ?? reportPath.match(/reports[/\\](\d{3})-/);
      const reportNum = req.reportNum ?? (numMatch ? numMatch[1].padStart(3, "0") : "000");

      // Parse score from stdout quickly
      const scoreMatch = result.stdout.match(/Score:\s*([\d.]+)\s*\/\s*5/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : undefined;

      const companyMatch = result.stdout.match(/Company:\s*(.+?)(\n|$)/i);
      const roleMatch    = result.stdout.match(/Role:\s*(.+?)(\n|$)/i);

      return {
        reportNum,
        reportPath,
        score,
        company: companyMatch?.[1].trim(),
        role:    roleMatch?.[1].trim(),
        raw:     result.stdout,
      };
    } finally {
      if (tmpJdPath) {
        try { unlinkSync(tmpJdPath); } catch { /* best-effort */ }
      }
    }
  }

  /**
   * Check liveness of a job posting URL via check-liveness.mjs.
   */
  async checkLiveness(url: string): Promise<{ alive: boolean; reason?: string }> {
    const result = await execScript("check-liveness.mjs", [url, "--json"], {
      allowFailure: true,
      timeoutMs: 30_000,
    });

    if (result.stdout) {
      try {
        return parseJsonOutput<{ alive: boolean; reason?: string }>(result, "check-liveness.mjs");
      } catch { /* fall through */ }
    }

    // Fallback: infer from exit code or stdout keywords
    const alive = result.exitCode === 0 && /active|live/i.test(result.stdout);
    return { alive, reason: result.stdout.slice(0, 200) || result.stderr.slice(0, 200) };
  }

  /**
   * Run pattern analysis (analyze-patterns.mjs) against the current tracker.
   */
  async analyzePatterns(): Promise<unknown> {
    const result = await execScript("analyze-patterns.mjs", [], { timeoutMs: 60_000 });
    return parseJsonOutput(result, "analyze-patterns.mjs");
  }

  /**
   * Get upskill recommendations (upskill.mjs).
   */
  async getUpskillGaps(): Promise<unknown> {
    const result = await execScript("upskill.mjs", [], { timeoutMs: 60_000 });
    return parseJsonOutput(result, "upskill.mjs");
  }

  /**
   * Get pipeline stats (stats.mjs).
   */
  async getStats(summary = false): Promise<unknown> {
    const args = summary ? ["--summary"] : [];
    const result = await execScript("stats.mjs", args, { timeoutMs: 30_000 });
    if (summary) return { raw: result.stdout };
    return parseJsonOutput(result, "stats.mjs");
  }
}

export const evalService = new EvalService();
