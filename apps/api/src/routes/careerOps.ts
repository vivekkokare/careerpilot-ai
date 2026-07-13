/**
 * /api/v1/career-ops — REST routes wrapping the career-ops integration services.
 *
 * All routes shell out to existing .mjs scripts; no logic is reimplemented here.
 * HITL (Human-In-The-Loop) is enforced: evaluation runs are queued/returned for
 * user review — the API never auto-submits applications.
 *
 * Routes:
 *   POST   /career-ops/tracker/status          — update application status (set-status.mjs)
 *   POST   /career-ops/tracker/merge            — merge tracker additions (merge-tracker.mjs)
 *   POST   /career-ops/tracker/reserve          — reserve report number
 *   DELETE /career-ops/tracker/reserve/:num     — release reserved number
 *   GET    /career-ops/tracker/raw              — read raw applications.md
 *
 *   POST   /career-ops/pdf/html-to-pdf          — HTML file → PDF (generate-pdf.mjs)
 *   POST   /career-ops/pdf/cover-letter         — cover letter payload → PDF
 *   GET    /career-ops/pdf/download/:filename   — serve a generated PDF
 *
 *   POST   /career-ops/eval                     — headless evaluation (gemini/openai/ollama)
 *   GET    /career-ops/eval/reports             — list report scores
 *   GET    /career-ops/eval/reports/:num        — get report scores by number
 *   POST   /career-ops/eval/liveness            — check job posting liveness
 *   GET    /career-ops/eval/patterns            — pattern analysis
 *   GET    /career-ops/eval/upskill             — upskill gap analysis
 *   GET    /career-ops/eval/stats               — pipeline stats
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { join, basename } from "path";
import { existsSync, readFileSync } from "fs";
import { trackerService } from "../services/tracker/TrackerService";
import { pdfService, CoverLetterPayload } from "../services/pdf/PdfService";
import { evalService, EvalProvider } from "../services/eval/EvalService";
import { scoringService } from "../services/eval/ScoringService";
import { CAREER_OPS_ROOT } from "../lib/shell";
import { logger } from "../lib/logger";

export const careerOpsRouter = Router();

// ── Helper ──────────────────────────────────────────────────────────────────

function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data });
}

function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ ok: false, error: message });
}

function wrap(fn: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

// ── Tracker ─────────────────────────────────────────────────────────────────

const SetStatusSchema = z.object({
  selector: z.string().min(1),
  state:    z.string().min(1),
  note:     z.string().optional(),
  role:     z.string().optional(),
  dryRun:   z.boolean().optional(),
});

careerOpsRouter.post("/tracker/status", wrap(async (req, res) => {
  const body = SetStatusSchema.parse(req.body);
  const result = await trackerService.setStatus(body.selector, body.state, {
    note:   body.note,
    role:   body.role,
    dryRun: body.dryRun,
  });
  return ok(res, result);
}));

careerOpsRouter.post("/tracker/merge", wrap(async (_req, res) => {
  const result = await trackerService.mergeTracker();
  return ok(res, result);
}));

careerOpsRouter.post("/tracker/reserve", wrap(async (req, res) => {
  const { count } = z.object({ count: z.number().int().min(1).max(50).optional() }).parse(req.body ?? {});
  if (count && count > 1) {
    const result = await trackerService.reserveReportRange(count);
    return ok(res, result);
  }
  const result = await trackerService.reserveReportNum();
  return ok(res, result);
}));

careerOpsRouter.delete("/tracker/reserve/:numOrRange", wrap(async (req, res) => {
  const { numOrRange } = req.params;
  if (!/^\d{1,3}(-\d{1,3})?$/.test(numOrRange)) {
    return fail(res, "Invalid number or range format");
  }
  await trackerService.releaseReportNum(numOrRange);
  return ok(res, { released: numOrRange });
}));

careerOpsRouter.get("/tracker/raw", wrap(async (_req, res) => {
  const raw = trackerService.readTracker();
  return ok(res, { raw });
}));

// ── PDF ──────────────────────────────────────────────────────────────────────

const HtmlToPdfSchema = z.object({
  /** Path to HTML file — must be inside the project directory */
  htmlPath:    z.string().min(1),
  reportNum:   z.string().optional(),
  format:      z.enum(["a4", "letter"]).optional(),
  allowReorder: z.boolean().optional(),
});

careerOpsRouter.post("/pdf/html-to-pdf", wrap(async (req, res) => {
  const body = HtmlToPdfSchema.parse(req.body);

  // Path traversal guard
  const safePath = join(CAREER_OPS_ROOT, body.htmlPath.replace(/\.\./g, ""));
  if (!safePath.startsWith(CAREER_OPS_ROOT)) {
    return fail(res, "Path traversal detected", 400);
  }
  if (!existsSync(safePath)) {
    return fail(res, `HTML file not found: ${body.htmlPath}`, 404);
  }

  const result = await pdfService.htmlToPdf(safePath, {
    reportNum:    body.reportNum,
    format:       body.format,
    allowReorder: body.allowReorder,
  });

  return ok(res, result);
}));

const CoverLetterCandidateSchema = z.object({
  name:        z.string(),
  email:       z.string().optional(),
  phone:       z.string().optional(),
  location:    z.string().optional(),
  linkedin:    z.string().optional(),
  github:      z.string().optional(),
  credentials: z.array(z.string()).optional(),
});

const CoverLetterLetterSchema = z.object({
  role_title:       z.string(),
  company:          z.string().optional(),
  city:             z.string().optional(),
  date:             z.string().optional(),
  greeting:         z.string().optional(),
  opening:          z.string(),
  profile_intro:    z.string(),
  achievements:     z.array(z.object({ lead: z.string(), impact: z.string() })).optional(),
  problems_section: z.string().optional(),
  closing:          z.string().optional(),
  language_closing: z.string().optional(),
  footnotes:        z.array(z.union([
    z.string(),
    z.object({ marker: z.string().optional(), text: z.string(), url: z.string().optional() }),
  ])).optional(),
});

const CoverLetterSchema = z.object({
  candidate:    CoverLetterCandidateSchema,
  letter:       CoverLetterLetterSchema,
  output_path:  z.string().optional(),
  template:     z.string().optional(),
  outputFilename: z.string().optional(),
});

careerOpsRouter.post("/pdf/cover-letter", wrap(async (req, res) => {
  const body = CoverLetterSchema.parse(req.body);
  const payload: CoverLetterPayload = {
    candidate:   body.candidate,
    letter:      body.letter,
    output_path: body.output_path,
    template:    body.template,
  };
  const result = await pdfService.generateCoverLetter(payload, body.outputFilename);
  return ok(res, result);
}));

careerOpsRouter.get("/pdf/download/:filename", wrap(async (req, res) => {
  const filename = basename(req.params.filename); // strip any path components
  const filePath = join(CAREER_OPS_ROOT, "output", filename);

  if (!filePath.startsWith(join(CAREER_OPS_ROOT, "output"))) {
    return fail(res, "Access denied", 403);
  }
  if (!existsSync(filePath) || !filename.endsWith(".pdf")) {
    return fail(res, "PDF not found", 404);
  }

  const buf = readFileSync(filePath);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buf.length);
  return res.end(buf);
}));

// ── Eval ─────────────────────────────────────────────────────────────────────

const EvalSchema = z.object({
  jdText:    z.string().min(50).optional(),
  jdFile:    z.string().optional(),
  provider:  z.enum(["gemini", "openai", "ollama", "openrouter"]).optional(),
  model:     z.string().optional(),
  reportNum: z.string().optional(),
});

careerOpsRouter.post("/eval", wrap(async (req, res) => {
  const body = EvalSchema.parse(req.body);
  if (!body.jdText && !body.jdFile) {
    return fail(res, "Either jdText or jdFile is required");
  }

  logger.info("eval.start", { provider: body.provider ?? "gemini" });

  const result = await evalService.evaluate({
    jdText:    body.jdText,
    jdFile:    body.jdFile,
    provider:  body.provider as EvalProvider | undefined,
    model:     body.model,
    reportNum: body.reportNum,
  });

  return ok(res, result);
}));

careerOpsRouter.get("/eval/reports", wrap(async (_req, res) => {
  const scores = scoringService.listReportScores();
  return ok(res, scores);
}));

careerOpsRouter.get("/eval/reports/:num", wrap(async (req, res) => {
  const score = scoringService.getScoreByReportNum(req.params.num);
  if (!score) return fail(res, `Report ${req.params.num} not found`, 404);
  return ok(res, score);
}));

careerOpsRouter.post("/eval/liveness", wrap(async (req, res) => {
  const { url } = z.object({ url: z.string().url() }).parse(req.body);
  const result  = await evalService.checkLiveness(url);
  return ok(res, result);
}));

careerOpsRouter.get("/eval/patterns", wrap(async (_req, res) => {
  const result = await evalService.analyzePatterns();
  return ok(res, result);
}));

careerOpsRouter.get("/eval/upskill", wrap(async (_req, res) => {
  const result = await evalService.getUpskillGaps();
  return ok(res, result);
}));

careerOpsRouter.get("/eval/stats", wrap(async (req, res) => {
  const summary = req.query.summary === "true";
  const result  = await evalService.getStats(summary);
  return ok(res, result);
}));
