import { CalendarDays, Clock, User, CheckCircle2, XCircle, Circle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ApplicationDetail } from "../../hooks/useApplication";

const OUTCOME_STYLES = {
  PASSED:  { icon: CheckCircle2, cls: "text-emerald-400" },
  FAILED:  { icon: XCircle,      cls: "text-red-400"     },
  PENDING: { icon: Circle,       cls: "text-muted-foreground" },
};

const ROUND_TYPE_LABELS: Record<string, string> = {
  PHONE_SCREEN:  "Phone screen",
  TECHNICAL:     "Technical",
  TAKE_HOME:     "Take-home",
  SYSTEM_DESIGN: "System design",
  BEHAVIOURAL:   "Behavioural",
  CULTURE_FIT:   "Culture fit",
  FINAL:         "Final round",
  OFFER:         "Offer call",
};

export function InterviewTab({ data }: { data: ApplicationDetail }) {
  const { interview } = data;

  if (!interview) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground py-16">
        No interview scheduled yet.
        <div className="mt-3">
          <Button size="sm" variant="outline">Schedule interview</Button>
        </div>
      </div>
    );
  }

  const rounds = [...(interview.rounds ?? [])].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Interview rounds</h3>
        <Button size="sm" variant="outline">Add round</Button>
      </div>

      {rounds.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No rounds recorded.</p>
      ) : (
        <ol className="relative border-l border-border/50 ml-3 space-y-6 pl-6">
          {rounds.map(round => {
            const outcome = round.outcome ?? "PENDING";
            const { icon: Icon, cls } = OUTCOME_STYLES[outcome as keyof typeof OUTCOME_STYLES] ?? OUTCOME_STYLES.PENDING;
            return (
              <li key={round.id} className="relative">
                {/* connector dot */}
                <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border/50">
                  <Icon className={cn("h-3.5 w-3.5", cls)} />
                </span>

                <div className="rounded-lg border border-border/50 bg-muted/10 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Round {round.roundNumber}
                      </span>
                      <h4 className="text-sm font-medium mt-0.5">
                        {ROUND_TYPE_LABELS[round.type] ?? round.type}
                      </h4>
                    </div>
                    <span className={cn("text-xs font-medium capitalize", cls)}>{outcome.toLowerCase()}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {round.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(round.scheduledAt), "MMM d, yyyy HH:mm")}
                      </span>
                    )}
                    {round.durationMins && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {round.durationMins} min
                      </span>
                    )}
                    {round.interviewerName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {round.interviewerName}
                      </span>
                    )}
                  </div>

                  {round.notes && (
                    <p className="text-sm text-muted-foreground border-t border-border/30 pt-2 mt-2">
                      {round.notes}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
