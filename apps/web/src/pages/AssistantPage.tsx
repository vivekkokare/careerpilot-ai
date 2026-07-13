/**
 * AI Assistant — one page for all 7 analysis features.
 *
 * Layout:
 *   Left panel  — context input (JD text, company, role) + action picker
 *   Right panel — streaming result with markdown rendering + copy button
 */

import { useState, useRef, useEffect } from "react";
import {
  FileText, Target, Key, Mail, Building2,
  MessageSquare, TrendingUp, Loader2, Copy, Check,
  RotateCcw, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAssistant, type AssistantAction } from "@/features/assistant/hooks/useAssistant";

// ── Action config ────────────────────────────────────────────────────────────

interface ActionConfig {
  id: AssistantAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiresJd: boolean;
  requiresCompany: boolean;
}

const ACTIONS: ActionConfig[] = [
  {
    id:              "resume_recommendation",
    label:           "Resume",
    icon:            FileText,
    description:     "Tailored improvements for this JD",
    requiresJd:      true,
    requiresCompany: false,
  },
  {
    id:              "ats_score",
    label:           "ATS Score",
    icon:            Target,
    description:     "ATS compatibility with section breakdown",
    requiresJd:      true,
    requiresCompany: false,
  },
  {
    id:              "keyword_match",
    label:           "Keywords",
    icon:            Key,
    description:     "Missing keywords vs JD requirements",
    requiresJd:      true,
    requiresCompany: false,
  },
  {
    id:              "cover_letter",
    label:           "Cover Letter",
    icon:            Mail,
    description:     "Draft cover letter from JD + resume",
    requiresJd:      true,
    requiresCompany: false,
  },
  {
    id:              "company_research",
    label:           "Company",
    icon:            Building2,
    description:     "6-axis company deep-dive",
    requiresJd:      false,
    requiresCompany: true,
  },
  {
    id:              "interview_questions",
    label:           "Interview",
    icon:            MessageSquare,
    description:     "Questions + model answers for this role",
    requiresJd:      false,
    requiresCompany: false,
  },
  {
    id:              "skill_gap",
    label:           "Skill Gap",
    icon:            TrendingUp,
    description:     "What you're missing and how to close it",
    requiresJd:      true,
    requiresCompany: false,
  },
];

// ── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ── Empty / placeholder state ─────────────────────────────────────────────────

function EmptyResult({ action }: { action: ActionConfig | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary/60" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {action ? `Ready to run ${action.label}` : "Select an action"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {action ? action.description : "Choose what you want to analyse on the left"}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const [activeAction, setActiveAction] = useState<AssistantAction>("resume_recommendation");
  const [jdText,   setJdText]   = useState("");
  const [company,  setCompany]  = useState("");
  const [role,     setRole]     = useState("");
  const [jdOpen,   setJdOpen]   = useState(true);

  const { result, isStreaming, error, run, reset } = useAssistant();
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as text streams in
  useEffect(() => {
    if (isStreaming && resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [result, isStreaming]);

  const config = ACTIONS.find(a => a.id === activeAction)!;

  const canRun = !isStreaming && (
    (config.requiresJd      && jdText.trim().length >= 50) ||
    (config.requiresCompany && company.trim().length >= 2) ||
    (!config.requiresJd     && !config.requiresCompany)
  );

  const handleRun = () => {
    run({ action: activeAction, jdText: jdText || undefined, company: company || undefined, role: role || undefined });
  };

  const handleActionChange = (id: AssistantAction) => {
    setActiveAction(id);
    reset();
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Left panel: inputs ─────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card/40">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold">AI Assistant</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Powered by Claude</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {/* Action picker */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
              Analysis
            </p>
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              const active = activeAction === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => handleActionChange(a.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    "hover:bg-accent/60",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", active && "text-primary")} />
                  <div className="min-w-0">
                    <p className={cn("text-xs font-medium", active && "text-foreground")}>{a.label}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">{a.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Context inputs */}
          <div className="px-3 pb-4 space-y-3 border-t border-border/50 pt-3 mt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Context
            </p>

            {/* Company + Role */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Company</Label>
                <Input
                  placeholder="e.g. Anthropic"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input
                  placeholder="e.g. Staff ML Engineer"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* JD input — collapsible */}
            <div className="space-y-1.5">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setJdOpen(o => !o)}
              >
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground cursor-pointer">Job Description</Label>
                  {config.requiresJd && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/40 text-amber-500">
                      required
                    </Badge>
                  )}
                </div>
                {jdOpen
                  ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                }
              </button>
              {jdOpen && (
                <Textarea
                  placeholder="Paste the full job description here…"
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  className="text-xs min-h-[140px] resize-none"
                />
              )}
              {!jdOpen && jdText && (
                <p className="text-xs text-muted-foreground/60 px-1">
                  {jdText.length.toLocaleString()} chars
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Run button */}
        <div className="p-3 border-t border-border shrink-0">
          <Button
            className="w-full gap-2"
            onClick={handleRun}
            disabled={!canRun}
            size="sm"
          >
            {isStreaming
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
              : <><Sparkles className="h-3.5 w-3.5" /> Run {config.label}</>
            }
          </Button>
          {config.requiresJd && !jdText.trim() && (
            <p className="text-xs text-muted-foreground/60 text-center mt-1.5">Paste a JD to enable</p>
          )}
          {config.requiresCompany && !company.trim() && (
            <p className="text-xs text-muted-foreground/60 text-center mt-1.5">Enter a company name to enable</p>
          )}
        </div>
      </div>

      {/* ── Right panel: result ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Result toolbar */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-border shrink-0 h-10">
          <div className="flex items-center gap-2">
            {(() => { const Icon = config.icon; return <Icon className="h-4 w-4 text-muted-foreground" />; })()}
            <span className="text-sm font-medium">{config.label}</span>
            {isStreaming && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                generating
              </span>
            )}
          </div>
          {result && (
            <div className="flex items-center gap-1">
              <CopyButton text={result} />
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Result content */}
        <div
          ref={resultRef}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          {!result && !error ? (
            <EmptyResult action={config} />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-sm prose-p:leading-relaxed
              prose-li:text-sm
              prose-table:text-xs prose-table:w-full
              prose-th:bg-muted/60 prose-th:px-3 prose-th:py-1.5
              prose-td:px-3 prose-td:py-1.5
              prose-code:text-xs prose-code:bg-muted/60 prose-code:px-1 prose-code:rounded
              prose-strong:text-foreground
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block h-4 w-0.5 bg-primary animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
