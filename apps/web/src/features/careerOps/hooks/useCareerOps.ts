/**
 * React Query hooks for the /api/v1/career-ops integration endpoints.
 *
 * These hooks wrap the career-ops .mjs script integrations:
 * - Tracker: status updates, report number reservation, raw tracker
 * - PDF: HTML→PDF conversion, cover letter generation
 * - Eval: headless evaluation, report scores, patterns, upskill, stats
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "@/lib/api";

// ── Key factory ──────────────────────────────────────────────────────────────

export const CAREER_OPS_KEYS = {
  trackerRaw:    () => ["career-ops", "tracker", "raw"] as const,
  reports:       () => ["career-ops", "eval", "reports"] as const,
  report:        (num: string) => ["career-ops", "eval", "reports", num] as const,
  patterns:      () => ["career-ops", "eval", "patterns"] as const,
  upskill:       () => ["career-ops", "eval", "upskill"] as const,
  stats:         (summary: boolean) => ["career-ops", "eval", "stats", summary] as const,
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  overall: number;
  blocks: Record<string, number>;
  legitimacy?: string;
  reportNum?: string;
  company?: string;
  role?: string;
  reportDate?: string;
}

export interface SetStatusResult {
  ok: boolean;
  row?: number;
  company?: string;
  role?: string;
  previousStatus?: string;
  newStatus?: string;
  dryRun?: boolean;
}

export interface EvalResult {
  reportNum: string;
  reportPath: string;
  score?: number;
  company?: string;
  role?: string;
}

// ── Tracker hooks ────────────────────────────────────────────────────────────

export function useRawTracker() {
  return useQuery({
    queryKey: CAREER_OPS_KEYS.trackerRaw(),
    queryFn:  () => get<{ raw: string }>("/career-ops/tracker/raw"),
    staleTime: 60_000,
  });
}

export function useSetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      selector: string;
      state: string;
      note?: string;
      role?: string;
      dryRun?: boolean;
    }) => post<SetStatusResult>("/career-ops/tracker/status", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAREER_OPS_KEYS.trackerRaw() });
    },
  });
}

export function useMergeTracker() {
  return useMutation({
    mutationFn: () => post<{ merged: number }>("/career-ops/tracker/merge"),
  });
}

export function useReserveReportNum() {
  return useMutation({
    mutationFn: (count?: number) =>
      post<{ num?: string; range?: string; nums?: string[] }>("/career-ops/tracker/reserve", count ? { count } : {}),
  });
}

// ── Eval hooks ────────────────────────────────────────────────────────────────

export function useReportScores() {
  return useQuery({
    queryKey: CAREER_OPS_KEYS.reports(),
    queryFn:  () => get<ScoreBreakdown[]>("/career-ops/eval/reports"),
    staleTime: 5 * 60_000,
  });
}

export function useReportScore(num: string, enabled = true) {
  return useQuery({
    queryKey: CAREER_OPS_KEYS.report(num),
    queryFn:  () => get<ScoreBreakdown>(`/career-ops/eval/reports/${num}`),
    enabled,
    staleTime: 10 * 60_000,
  });
}

export function usePatternAnalysis() {
  return useQuery({
    queryKey: CAREER_OPS_KEYS.patterns(),
    queryFn:  () => get<unknown>("/career-ops/eval/patterns"),
    staleTime: 10 * 60_000,
  });
}

export function useUpskillGaps() {
  return useQuery({
    queryKey: CAREER_OPS_KEYS.upskill(),
    queryFn:  () => get<unknown>("/career-ops/eval/upskill"),
    staleTime: 10 * 60_000,
  });
}

export function usePipelineStats(summary = false) {
  return useQuery({
    queryKey: CAREER_OPS_KEYS.stats(summary),
    queryFn:  () => get<unknown>(`/career-ops/eval/stats${summary ? "?summary=true" : ""}`),
    staleTime: 5 * 60_000,
  });
}

export function useCheckLiveness() {
  return useMutation({
    mutationFn: (url: string) =>
      post<{ alive: boolean; reason?: string }>("/career-ops/eval/liveness", { url }),
  });
}

export function useRunEval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      jdText?: string;
      provider?: "gemini" | "openai" | "ollama" | "openrouter";
      model?: string;
      reportNum?: string;
    }) => post<EvalResult>("/career-ops/eval", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAREER_OPS_KEYS.reports() });
      qc.invalidateQueries({ queryKey: CAREER_OPS_KEYS.trackerRaw() });
    },
  });
}

// ── PDF hooks ─────────────────────────────────────────────────────────────────

export function useGeneratePdf() {
  return useMutation({
    mutationFn: (vars: {
      htmlPath: string;
      reportNum?: string;
      format?: "a4" | "letter";
      allowReorder?: boolean;
    }) => post<{ outputPath: string; pageCount: number; sizeBytes: number; relativePath: string }>(
      "/career-ops/pdf/html-to-pdf",
      vars,
    ),
  });
}

export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: (vars: {
      candidate: Record<string, unknown>;
      letter: Record<string, unknown>;
      output_path?: string;
      outputFilename?: string;
    }) => post<{ outputPath: string; pageCount: number; sizeBytes: number; relativePath: string }>(
      "/career-ops/pdf/cover-letter",
      vars,
    ),
  });
}
