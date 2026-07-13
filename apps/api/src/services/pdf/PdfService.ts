/**
 * PdfService — wraps generate-pdf.mjs and generate-cover-letter.mjs.
 *
 * Does NOT reimplement Playwright logic. Shells out to the existing scripts.
 * The HTML template filling (cv-template.html) is handled by the AI agent
 * (pdf mode) before calling this service — this service only converts HTML→PDF.
 */

import { execScript, CAREER_OPS_ROOT } from "../../lib/shell";
import { join, resolve } from "path";
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { randomUUID } from "crypto";

export interface PdfResult {
  outputPath: string;
  pageCount: number;
  sizeBytes: number;
  relativePath: string;
}

export interface CoverLetterPayload {
  candidate: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    credentials?: string[];
  };
  letter: {
    role_title: string;
    company?: string;
    city?: string;
    date?: string;
    greeting?: string;
    opening: string;
    profile_intro: string;
    achievements?: Array<{ lead: string; impact: string }>;
    problems_section?: string;
    closing?: string;
    language_closing?: string;
    footnotes?: Array<{ marker?: string; text: string; url?: string } | string>;
  };
  output_path?: string;
  template?: string;
}

export class PdfService {
  private readonly outputDir = join(CAREER_OPS_ROOT, "output");

  /**
   * Convert an existing HTML file to PDF.
   * @param htmlPath — absolute path to the pre-built HTML file
   * @param reportNum — optional tracker/report number for manifest indexing
   * @param format — "a4" (default) or "letter"
   * @param allowReorder — downgrade section-order guard to warning
   */
  async htmlToPdf(
    htmlPath: string,
    opts: { reportNum?: string; format?: "a4" | "letter"; allowReorder?: boolean; outputPath?: string } = {},
  ): Promise<PdfResult> {
    const format = opts.format ?? "a4";
    const outputPath = opts.outputPath ?? join(this.outputDir, `cv-${randomUUID()}.pdf`);

    mkdirSync(this.outputDir, { recursive: true });

    const args = [htmlPath, outputPath, `--format=${format}`];
    if (opts.reportNum)   args.push(`--report=${opts.reportNum}`);
    if (opts.allowReorder) args.push("--allow-reorder");

    const result = await execScript("generate-pdf.mjs", args, { timeoutMs: 60_000 });

    // Parse page count and size from stdout
    const pageMatch = result.stdout.match(/Pages:\s*(\d+)/);
    const sizeMatch = result.stdout.match(/Size:\s*([\d.]+)\s*KB/);

    const pageCount = pageMatch ? parseInt(pageMatch[1], 10) : 1;
    const sizeBytes = sizeMatch ? Math.round(parseFloat(sizeMatch[1]) * 1024) : 0;

    return {
      outputPath,
      pageCount,
      sizeBytes,
      relativePath: outputPath.replace(CAREER_OPS_ROOT + "/", ""),
    };
  }

  /**
   * Generate a cover letter PDF from a structured payload.
   * Writes a temp JSON payload file, shells out to generate-cover-letter.mjs.
   */
  async generateCoverLetter(
    payload: CoverLetterPayload,
    outputFilename?: string,
  ): Promise<PdfResult> {
    mkdirSync(this.outputDir, { recursive: true });

    // Determine output path
    if (!payload.output_path && outputFilename) {
      payload.output_path = outputFilename;
    }

    // Write payload to a temp file
    const tmpPayloadPath = join(this.outputDir, `.cover-payload-${randomUUID()}.json`);
    writeFileSync(tmpPayloadPath, JSON.stringify(payload), "utf-8");

    try {
      const result = await execScript("generate-cover-letter.mjs", ["--payload", tmpPayloadPath], {
        timeoutMs: 60_000,
      });

      // Parse output path from stdout: "Cover letter PDF: output/..."
      const match = result.stdout.match(/Cover letter PDF:\s*(.+)/);
      const outputPath = match
        ? resolve(CAREER_OPS_ROOT, match[1].trim())
        : join(this.outputDir, "cover-letter.pdf");

      const sizeBytes = existsSync(outputPath)
        ? readFileSync(outputPath).length
        : 0;

      return {
        outputPath,
        pageCount: 1,
        sizeBytes,
        relativePath: outputPath.replace(CAREER_OPS_ROOT + "/", ""),
      };
    } finally {
      try { unlinkSync(tmpPayloadPath); } catch { /* best-effort cleanup */ }
    }
  }

  /**
   * Read a generated PDF as a Buffer (for HTTP response streaming).
   */
  readPdf(absolutePath: string): Buffer {
    if (!absolutePath.startsWith(CAREER_OPS_ROOT)) {
      throw new Error("Path traversal guard: PDF must be inside the project directory");
    }
    return readFileSync(absolutePath);
  }
}

export const pdfService = new PdfService();
