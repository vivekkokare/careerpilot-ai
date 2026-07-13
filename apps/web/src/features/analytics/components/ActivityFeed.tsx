/**
 * ActivityFeed — append-only timeline of recent events.
 * Each event type has a distinct icon and colour; the timeline is a vertical
 * dotted line connecting the dots.
 */
import { motion } from "framer-motion";
import {
  Zap,
  ArrowRightLeft,
  CalendarDays,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatRelative, formatScore, scoreColorClass } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECENT_ACTIVITY } from "../mockData";
import type { ActivityType } from "@/types/api";

const TYPE_CONFIG: Record<
  ActivityType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  EVALUATION_COMPLETED:  { icon: Zap,           color: "text-blue-500",    bg: "bg-blue-500/10"    },
  STATUS_CHANGED:        { icon: ArrowRightLeft, color: "text-violet-500",  bg: "bg-violet-500/10"  },
  INTERVIEW_SCHEDULED:   { icon: CalendarDays,   color: "text-amber-500",   bg: "bg-amber-500/10"   },
  INTERVIEW_COMPLETED:   { icon: CheckCircle2,   color: "text-amber-500",   bg: "bg-amber-500/10"   },
  DOCUMENT_GENERATED:    { icon: FileText,       color: "text-cyan-500",    bg: "bg-cyan-500/10"    },
  APPLICATION_SUBMITTED: { icon: Send,           color: "text-emerald-500", bg: "bg-emerald-500/10" },
  NOTE_ADDED:            { icon: FileText,       color: "text-muted-foreground", bg: "bg-muted" },
  EMAIL_DRAFTED:         { icon: Send,           color: "text-cyan-500",    bg: "bg-cyan-500/10"    },
  OFFER_RECEIVED:        { icon: CheckCircle2,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
  FOLLOW_UP_SENT:        { icon: Send,           color: "text-blue-500",    bg: "bg-blue-500/10"    },
  SCAN_FOUND:            { icon: Zap,            color: "text-blue-500",    bg: "bg-blue-500/10"    },
  SHEETS_SYNCED:         { icon: ArrowRightLeft, color: "text-violet-500",  bg: "bg-violet-500/10"  },
  REMINDER_FIRED:        { icon: CalendarDays,   color: "text-amber-500",   bg: "bg-amber-500/10"   },
  PLUGIN_HOOK:           { icon: Zap,            color: "text-muted-foreground", bg: "bg-muted"      },
  STATUS_CHANGED_X:      { icon: XCircle,        color: "text-co-score-low", bg: "bg-red-500/10"   },
} as Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }>;

function getConfig(type: ActivityType) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: Zap,
      color: "text-muted-foreground",
      bg: "bg-muted",
    }
  );
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          <Badge variant="outline" className="text-[10px] h-5">
            Last 7 days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ol
          className="relative space-y-0"
          aria-label="Activity timeline"
        >
          {/* Vertical connector line */}
          <div
            className="absolute left-[19px] top-3 bottom-3 w-px bg-border"
            aria-hidden="true"
          />

          {RECENT_ACTIVITY.map((event, i) => {
            const { icon: Icon, color, bg } = getConfig(event.type);
            const isRejection = event.summary.toLowerCase().includes("rejected");

            return (
              <motion.li
                key={event.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex gap-4 pb-5 last:pb-0"
              >
                {/* Icon dot */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 border border-border",
                    bg
                  )}
                >
                  <Icon className={cn("w-4 h-4", color)} aria-hidden="true" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        <span className="font-semibold">{event.company}</span>
                        {" — "}
                        <span className="text-muted-foreground font-normal">{event.role}</span>
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-0.5",
                          isRejection ? "text-co-score-low" : "text-muted-foreground"
                        )}
                      >
                        {event.summary}
                        {"score" in event && event.score != null && (
                          <span className={cn("ml-1.5 font-semibold", scoreColorClass(event.score))}>
                            {formatScore(event.score)}/5
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatRelative(event.occurredAt)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono">
                        #{event.reportNum}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
