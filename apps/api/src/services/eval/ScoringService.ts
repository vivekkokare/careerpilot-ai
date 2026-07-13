/**
 * ScoringService — parses score blocks from career-ops markdown evaluation reports.
 *
 * Reports live in reports/{NNN}-{slug}-{date}.md.
 * Scores are written by the evaluation engine (oferta.md) in a structured block.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { CAREER_OPS_ROOT } from "../../lib/shell";

export interface ScoreBreakdown {
  overall: number;
  /** Block A–F scores, keyed by block label */
  blocks: Record<string, number>;
  legitimacy?: string;
  reportNum?: string;
  company?: string;
  role?: string;
  reportDate?: string;
  reportPath?: string;
}

const REPORTS_DIR = join(CAREER_OPS_ROOT, "reports");

/**
 * Parse the overall score and block scores from a report markdown string.
 * Handles the standard oferta.md report format:
 *   **Score:** 4.2/5
 *   **Legitimacy:** Tier 1 – Verified company
 */
export function parseReportScores(markdown: string): Partial<ScoreBreakdown> {
  const result: Partial<ScoreBreakdown> = { blocks: {} };

  // Overall score: **Score:** 4.2/5
  const overallMatch = markdown.match(/\*\*Score:\*\*\s*([\d.]+)\s*\/\s*5/i);
  if (overallMatch) result.overall = parseFloat(overallMatch[1]);

  // Legitimacy tier
  const legMatch = markdown.match(/\*\*Legitimacy:\*\*\s*(.+?)(\n|$)/i);
  if (legMatch) result.legitimacy = legMatch[1].trim();

  // Block scores — matches lines like:
  //   **A. Technical Match** — 4.5/5
  //   | A | Technical Match | 4.5/5 |
  //   **Block A:** 4.5/5
  const blockPatterns = [
    /\*\*([A-F])[.\s:]+([^*\n]+?)\*\*\s*[—–-]+\s*([\d.]+)\s*\/\s*5/gi,
    /\|\s*([A-F])\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)\s*\/\s*5\s*\|/gi,
    /\*\*Block\s+([A-F])(?:[:\s]+([^*\n]*)?)?\*\*[:\s]+([\d.]+)\s*\/\s*5/gi,
    /\|\s*([A-F])\.\s*([^|]+?)\s*\|\s*([\d.]+)\s*\/\s*5/gi,
  ];

  for (const pattern of blockPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(markdown)) !== null) {
      const block = m[1].toUpperCase();
      const label = m[2]?.trim() || block;
      const score = parseFloat(m[3]);
      if (!isNaN(score)) {
        result.blocks![`${block}. ${label}`] = score;
      }
    }
  }

  return result;
}

export class ScoringService {
  /**
   * Parse scores from a report file by its number (e.g. "042").
   */
  getScoreByReportNum(reportNum: string): ScoreBreakdown | null {
    if (!existsSync(REPORTS_DIR)) return null;

    const files = readdirSync(REPORTS_DIR);
    const padded = reportNum.padStart(3, "0");
    const file = files.find(f => f.startsWith(padded + "-") && f.endsWith(".md"));
    if (!file) return null;

    const content = readFileSync(join(REPORTS_DIR, file), "utf-8");
    return this.parseReportFile(content, file);
  }

  /**
   * Parse a report file and enrich with metadata from the filename.
   * Filename format: {NNN}-{company-slug}-{YYYY-MM-DD}.md
   */
  parseReportFile(content: string, filename: string): ScoreBreakdown {
    const scores = parseReportScores(content);

    // Extract metadata from filename
    const parts = filename.replace(".md", "").split("-");
    const reportNum = parts[0];
    const reportDate = parts.length >= 4 ? parts.slice(-3).join("-") : undefined;
    const companySlug = parts.length >= 4 ? parts.slice(1, -3).join("-") : parts.slice(1).join("-");

    // Extract company and role from report header
    const companyMatch = content.match(/\*\*Company:\*\*\s*(.+?)(\n|$)/i);
    const roleMatch    = content.match(/\*\*Role:\*\*\s*(.+?)(\n|$)/i)
                      ?? content.match(/\*\*Position:\*\*\s*(.+?)(\n|$)/i);

    return {
      overall:    scores.overall ?? 0,
      blocks:     scores.blocks ?? {},
      legitimacy: scores.legitimacy,
      reportNum,
      company:    companyMatch?.[1].trim() ?? companySlug,
      role:       roleMatch?.[1].trim(),
      reportDate,
      reportPath: join(REPORTS_DIR, filename),
    };
  }

  /**
   * List all available reports with their scores (lightweight — parses headers only).
   */
  listReportScores(): ScoreBreakdown[] {
    if (!existsSync(REPORTS_DIR)) return [];

    return readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith(".md") && /^\d{3}-/.test(f) && !f.endsWith("-RESERVED.md"))
      .map(f => {
        try {
          const content = readFileSync(join(REPORTS_DIR, f), "utf-8");
          return this.parseReportFile(content, f);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ScoreBreakdown[];
  }
}

export const scoringService = new ScoringService();
