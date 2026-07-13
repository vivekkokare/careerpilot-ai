/**
 * AiAssistantService — Claude-powered analysis for the AI Assistant feature.
 *
 * Reads cv.md from CAREER_OPS_ROOT as the resume context.
 * Streams responses back as SSE via the Express response object.
 * Uses the Anthropic Messages API directly (no SDK dep needed — Node 18+ fetch).
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { ServerResponse } from "http";
import { CAREER_OPS_ROOT } from "../shell";
import { logger } from "../../lib/logger";

// ── Action types ─────────────────────────────────────────────────────────────

export type AssistantAction =
  | "resume_recommendation"
  | "ats_score"
  | "keyword_match"
  | "cover_letter"
  | "company_research"
  | "interview_questions"
  | "skill_gap";

export interface AnalyzeRequest {
  action: AssistantAction;
  jdText?: string;
  company?: string;
  role?: string;
  /** Override cv.md content — used by browser extension passing scraped resume */
  resumeOverride?: string;
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const BASE_SYSTEM = `You are a senior career coach and technical recruiter with deep expertise in AI/ML roles.
Be direct, specific, and actionable. Use markdown for structure.
Never fabricate facts. If context is missing, say what you need.`;

function buildPrompt(req: AnalyzeRequest, resume: string): { system: string; user: string } {
  const jdBlock    = req.jdText  ? `\n\n<job_description>\n${req.jdText.slice(0, 8000)}\n</job_description>` : "";
  const resumeBlock = `\n\n<resume>\n${resume.slice(0, 6000)}\n</resume>`;
  const roleHint   = req.role    ? ` for the role "${req.role}"` : "";
  const compHint   = req.company ? ` at ${req.company}` : "";

  switch (req.action) {
    case "resume_recommendation":
      return {
        system: BASE_SYSTEM,
        user: `Review this resume against the job description and give 5–8 specific, prioritised improvements.
For each: what to change, why it matters for this JD, and a concrete rewrite example.${jdBlock}${resumeBlock}`,
      };

    case "ats_score":
      return {
        system: BASE_SYSTEM,
        user: `Score this resume for ATS compatibility against the job description.

Return exactly this structure:
## ATS Score: [X]/100

### Section Scores
| Section | Score | Notes |
|---------|-------|-------|
| Contact & Format | /20 | ... |
| Keywords | /30 | ... |
| Work Experience | /25 | ... |
| Skills Section | 15 | ... |
| Education | /10 | ... |

### Critical Issues
[bullet list]

### Quick Wins
[bullet list — changes that raise the score most]${jdBlock}${resumeBlock}`,
      };

    case "keyword_match":
      return {
        system: BASE_SYSTEM,
        user: `Extract every important keyword and phrase from the job description. For each, indicate whether it appears in the resume.

Return exactly this structure:
## Keyword Analysis

### Critical Keywords (must-have)
| Keyword | In Resume | Where Found |
|---------|-----------|-------------|
| keyword | ✓ / ✗ | "exact quote" or — |

### Preferred Keywords
[same table format]

### Missing Keywords to Add
[prioritised list with suggested placement in resume]${jdBlock}${resumeBlock}`,
      };

    case "cover_letter":
      return {
        system: BASE_SYSTEM,
        user: `Write a professional cover letter${roleHint}${compHint}.

Rules:
- 3–4 paragraphs, ~300 words
- Opening: specific hook tied to company's mission or recent news
- Body: 2 concrete achievements mapped to the JD's top requirements (use numbers from the resume)
- Closing: clear ask, no fluff
- Tone: confident, direct — not sycophantic${jdBlock}${resumeBlock}`,
      };

    case "company_research":
      return {
        system: BASE_SYSTEM,
        user: `Research ${req.company ?? "this company"} across these 6 axes. Be specific; skip any axis you lack reliable data for.

## Company Research: ${req.company ?? ""}

### 1. AI/Tech Strategy
What they're building, their technical bets, announced products.

### 2. Engineering Culture
Team size, tech stack, ways of working, what their job ads reveal.

### 3. Recent Moves
Funding, acquisitions, layoffs, leadership changes (last 12 months).

### 4. Red Flags
Glassdoor patterns, Blind signals, repeated re-postings, vague equity terms.

### 5. Competitive Position
Main competitors, moat, market trajectory.

### 6. Your Angle
Given the candidate's background, what's the strongest positioning for this company?${resumeBlock}`,
      };

    case "interview_questions":
      return {
        system: BASE_SYSTEM,
        user: `Generate 10 interview questions${roleHint}${compHint} with model answers grounded in the candidate's resume.

For each question:
**Q[N]: [Question]**
*Why they ask this:* one sentence
*Strong answer:* 3–5 sentences drawing on specific resume evidence
*Watch out for:* one common mistake to avoid${jdBlock}${resumeBlock}`,
      };

    case "skill_gap":
      return {
        system: BASE_SYSTEM,
        user: `Identify every skill gap between the job requirements and the candidate's resume.

## Skill Gap Analysis

### Critical Gaps (blockers)
| Skill | JD Requirement | Candidate Level | How to Close | Timeline |
|-------|---------------|-----------------|--------------|----------|

### Moderate Gaps (worth addressing)
[same table]

### Strengths (candidate exceeds requirements)
[bullet list]

### Recommended Learning Path
Ordered list of the top 3 gaps to close first, with specific resources.${jdBlock}${resumeBlock}`,
      };

    default:
      return { system: BASE_SYSTEM, user: `Help with: ${req.action}${jdBlock}${resumeBlock}` };
  }
}

// ── Streaming helper ─────────────────────────────────────────────────────────

function sseWrite(res: ServerResponse, event: object) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// ── Service ──────────────────────────────────────────────────────────────────

export class AiAssistantService {
  private readonly apiKey = process.env["ANTHROPIC_API_KEY"] ?? "";
  private readonly model  = process.env["ASSISTANT_MODEL"] ?? "claude-sonnet-4-6";
  private readonly cvPath = join(CAREER_OPS_ROOT, "cv.md");

  readResume(): string {
    if (existsSync(this.cvPath)) {
      return readFileSync(this.cvPath, "utf-8");
    }
    return "";
  }

  /**
   * Stream a Claude response for the given action onto an SSE Express response.
   * Caller is responsible for setting headers before calling.
   */
  async streamAnalysis(req: AnalyzeRequest, res: ServerResponse): Promise<void> {
    if (!this.apiKey) {
      sseWrite(res, { type: "error", message: "ANTHROPIC_API_KEY not set. Add it to your .env file." });
      res.end();
      return;
    }

    const resume = req.resumeOverride ?? this.readResume();
    const { system, user } = buildPrompt(req, resume);

    logger.info("assistant.stream", { action: req.action, model: this.model });

    let fetchRes: Response;
    try {
      fetchRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          stream: true,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error reaching Anthropic API";
      sseWrite(res, { type: "error", message: msg });
      res.end();
      return;
    }

    if (!fetchRes.ok) {
      const body = await fetchRes.text().catch(() => "");
      logger.error("assistant.api_error", { status: fetchRes.status, body: body.slice(0, 300) });
      sseWrite(res, { type: "error", message: `Anthropic API error ${fetchRes.status}: ${body.slice(0, 200)}` });
      res.end();
      return;
    }

    const reader = fetchRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;

          try {
            const evt = JSON.parse(raw) as {
              type: string;
              delta?: { type: string; text?: string };
            };
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta.text) {
              sseWrite(res, { type: "chunk", text: evt.delta.text });
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    sseWrite(res, { type: "done" });
    res.end();
  }

  /**
   * Non-streaming analysis — for browser extension clip endpoint.
   * Returns complete text response.
   */
  async analyze(req: AnalyzeRequest): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const resume = req.resumeOverride ?? this.readResume();
    const { system, user } = buildPrompt(req, resume);

    const fetchRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!fetchRes.ok) {
      const body = await fetchRes.text().catch(() => "");
      throw new Error(`Anthropic API error ${fetchRes.status}: ${body.slice(0, 200)}`);
    }

    const data = await fetchRes.json() as { content: Array<{ type: string; text?: string }> };
    return data.content.find(b => b.type === "text")?.text ?? "";
  }
}

export const aiAssistantService = new AiAssistantService();
