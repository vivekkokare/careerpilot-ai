/**
 * /api/v1/assistant — AI Assistant routes
 *
 * POST /assistant/analyze        — SSE stream: resume rec, ATS score, keywords,
 *                                   cover letter, company research, interview Qs, skill gap
 * POST /assistant/clip           — Browser extension: clip a job page, get instant analysis
 * GET  /assistant/capabilities   — Browser extension discovery: what actions are supported
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { aiAssistantService, AssistantAction } from "../services/ai/AiAssistantService";
import { logger } from "../lib/logger";

export const assistantRouter = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

const ACTIONS: AssistantAction[] = [
  "resume_recommendation",
  "ats_score",
  "keyword_match",
  "cover_letter",
  "company_research",
  "interview_questions",
  "skill_gap",
];

const AnalyzeSchema = z.object({
  action:         z.enum(ACTIONS as [AssistantAction, ...AssistantAction[]]),
  jdText:         z.string().max(12000).optional(),
  company:        z.string().max(200).optional(),
  role:           z.string().max(200).optional(),
  resumeOverride: z.string().max(10000).optional(),
});

const ClipSchema = z.object({
  url:       z.string().url(),
  title:     z.string().max(300).optional(),
  bodyText:  z.string().max(15000),
  action:    z.enum([...ACTIONS, "auto"] as [string, ...string[]]).optional().default("auto"),
  company:   z.string().max(200).optional(),
  role:      z.string().max(200).optional(),
});

// ── POST /analyze — SSE streaming ────────────────────────────────────────────

assistantRouter.post("/analyze", (req: Request, res: Response) => {
  let body: z.infer<typeof AnalyzeSchema>;
  try {
    body = AnalyzeSchema.parse(req.body);
  } catch (err) {
    res.status(400).json({ ok: false, error: "Validation error", details: (err as z.ZodError).issues });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Keep-alive ping so the connection stays open during long generations
  const ping = setInterval(() => res.write(": ping\n\n"), 15_000);
  req.on("close", () => clearInterval(ping));

  aiAssistantService.streamAnalysis(body, res).catch((err) => {
    logger.error("assistant.stream_error", { message: err.message });
    clearInterval(ping);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
      res.end();
    }
  }).finally(() => clearInterval(ping));
});

// ── POST /clip — Browser extension endpoint ───────────────────────────────────

assistantRouter.post("/clip", async (req: Request, res: Response) => {
  let body: z.infer<typeof ClipSchema>;
  try {
    body = ClipSchema.parse(req.body);
  } catch (err) {
    res.status(400).json({ ok: false, error: "Validation error", details: (err as z.ZodError).issues });
    return;
  }

  // Auto-detect action: if bodyText looks like a JD, default to ats_score
  const action: AssistantAction = (body.action === "auto" || !body.action)
    ? "ats_score"
    : body.action as AssistantAction;

  try {
    const result = await aiAssistantService.analyze({
      action,
      jdText:  body.bodyText,
      company: body.company,
      role:    body.role,
    });

    res.json({
      ok:     true,
      action,
      result,
      source: { url: body.url, title: body.title },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    logger.error("assistant.clip_error", { message: msg });
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /capabilities — Extension discovery ───────────────────────────────────

assistantRouter.get("/capabilities", (_req: Request, res: Response) => {
  res.json({
    version: "1.0",
    actions: [
      { id: "resume_recommendation", label: "Resume Recommendations",  description: "Specific improvements to match a JD" },
      { id: "ats_score",             label: "ATS Score",               description: "ATS compatibility score with section breakdown" },
      { id: "keyword_match",         label: "Keyword Match",           description: "JD keywords vs resume — what's missing" },
      { id: "cover_letter",          label: "Cover Letter",            description: "Tailored cover letter from JD + resume" },
      { id: "company_research",      label: "Company Research",        description: "6-axis company deep-dive" },
      { id: "interview_questions",   label: "Interview Questions",     description: "Role-specific questions with model answers" },
      { id: "skill_gap",             label: "Skill Gap Analysis",      description: "Requirements vs resume — gaps and learning path" },
    ],
    clipEndpoint: "/api/v1/assistant/clip",
    analyzeEndpoint: "/api/v1/assistant/analyze",
  });
});
