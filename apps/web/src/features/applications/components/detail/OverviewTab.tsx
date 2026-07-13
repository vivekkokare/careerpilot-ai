import { ExternalLink, Shield, TrendingUp, Users, Flag } from "lucide-react";
import { formatCurrency, formatScore, scoreColorClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ApplicationDetail } from "../../hooks/useApplication";

const LEGITIMACY_STYLES: Record<string, { label: string; cls: string }> = {
  HIGH_CONFIDENCE:      { label: "High confidence",      cls: "text-emerald-400 bg-emerald-400/10" },
  PROCEED_WITH_CAUTION: { label: "Proceed with caution", cls: "text-amber-400 bg-amber-400/10" },
  RED_FLAG:             { label: "Red flag",             cls: "text-red-400 bg-red-400/10" },
};

interface ScoreRowProps { label: string; value: number | null | undefined; }
function ScoreRow({ label, value }: ScoreRowProps) {
  if (value == null) return null;
  const pct = Math.round((value / 5) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", scoreColorClass(value)
            .replace("text-", "bg-"))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-sm font-mono font-medium w-8 text-right", scoreColorClass(value))}>
        {formatScore(value)}
      </span>
    </div>
  );
}

export function OverviewTab({ data }: { data: ApplicationDetail }) {
  const { application, evaluation } = data;
  const comp = application.advertisedCompMin;
  const leg = application.legitimacyTier
    ? LEGITIMACY_STYLES[application.legitimacyTier]
    : null;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {comp && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Comp range</p>
            <p className="text-sm font-medium">
              {formatCurrency(comp, application.advertisedCompCurrency ?? "USD")}
              {application.advertisedCompMax && ` – ${formatCurrency(application.advertisedCompMax, application.advertisedCompCurrency ?? "USD")}`}
            </p>
          </div>
        )}
        {application.archetypeA && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Archetype</p>
            <p className="text-sm font-medium leading-tight">{application.archetypeA.replace(/_/g, " ")}</p>
          </div>
        )}
        {leg && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Legitimacy</p>
            <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", leg.cls)}>{leg.label}</span>
          </div>
        )}
      </div>

      {/* JD link */}
      {evaluation?.jdUrl && (
        <div>
          <a
            href={evaluation.jdUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View job posting
          </a>
        </div>
      )}

      {/* Score breakdown */}
      {evaluation && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Score breakdown
          </h3>
          <div className="space-y-2.5">
            <ScoreRow label="Match"       value={evaluation.scoreMatch} />
            <ScoreRow label="North Star"  value={evaluation.scoreNorthStar} />
            <ScoreRow label="Comp"        value={evaluation.scoreComp} />
            <ScoreRow label="Culture"     value={evaluation.scoreCultural} />
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Global score</span>
            <span className={cn("text-lg font-bold font-mono", scoreColorClass(evaluation.scoreGlobal))}>
              {formatScore(evaluation.scoreGlobal)}<span className="text-xs text-muted-foreground font-normal">/5</span>
            </span>
          </div>
        </div>
      )}

      {/* Company info */}
      {application.company && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            Company
          </h3>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center font-bold text-sm">
              {application.company.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{application.company.name}</p>
              {application.company.website && (
                <a href={application.company.website} target="_blank" rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground">
                  {application.company.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracker notes */}
      {application.trackerNotes && (
        <div>
          <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
            <Flag className="h-4 w-4 text-muted-foreground" />
            Notes
          </h3>
          <p className="text-sm text-muted-foreground">{application.trackerNotes}</p>
        </div>
      )}
    </div>
  );
}
