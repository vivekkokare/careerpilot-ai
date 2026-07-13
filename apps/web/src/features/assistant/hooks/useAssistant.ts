/**
 * useAssistant — streams AI analysis from POST /api/v1/assistant/analyze.
 *
 * Uses fetch + ReadableStream (not EventSource) so we can POST JSON.
 * The hook exposes { result, isStreaming, error, run, reset }.
 */

import { useState, useCallback, useRef } from "react";

export type AssistantAction =
  | "resume_recommendation"
  | "ats_score"
  | "keyword_match"
  | "cover_letter"
  | "company_research"
  | "interview_questions"
  | "skill_gap";

export interface AssistantRequest {
  action: AssistantAction;
  jdText?: string;
  company?: string;
  role?: string;
}

interface SseEvent {
  type: "chunk" | "done" | "error";
  text?: string;
  message?: string;
}

const API_BASE = import.meta.env["VITE_API_URL"]
  ? `${import.meta.env["VITE_API_URL"]}/api/v1`
  : "/api/v1";

export function useAssistant() {
  const [result, setResult]       = useState("");
  const [isStreaming, setStreaming] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const abortRef                  = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResult("");
    setError(null);
    setStreaming(false);
  }, []);

  const run = useCallback(async (req: AssistantRequest) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setResult("");
    setError(null);
    setStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/assistant/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        const msg = (() => { try { return (JSON.parse(text) as { error?: string }).error ?? text; } catch { return text || `HTTP ${res.status}`; } })();
        setError(msg);
        setStreaming(false);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();

          let evt: SseEvent;
          try { evt = JSON.parse(raw) as SseEvent; } catch { continue; }

          if (evt.type === "chunk" && evt.text) {
            setResult(prev => prev + evt.text);
          } else if (evt.type === "error") {
            setError(evt.message ?? "Unknown error");
            break;
          } else if (evt.type === "done") {
            break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setStreaming(false);
    }
  }, []);

  return { result, isStreaming, error, run, reset };
}
