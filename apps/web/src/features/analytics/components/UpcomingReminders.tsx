/**
 * UpcomingReminders — sorted list of pending reminders with type icons,
 * urgency highlight, and relative due-time display.
 */
import { motion } from "framer-motion";
import { Bell, CalendarDays, DollarSign, AlertCircle } from "lucide-react";
import { formatDistanceToNow, parseISO, isPast, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UPCOMING_REMINDERS } from "../mockData";

type ReminderType = "follow_up" | "interview" | "offer";

const TYPE_ICON: Record<ReminderType, React.ComponentType<{ className?: string }>> = {
  follow_up: Bell,
  interview: CalendarDays,
  offer:     DollarSign,
};

const TYPE_COLOR: Record<ReminderType, string> = {
  follow_up: "text-blue-500",
  interview: "text-amber-500",
  offer:     "text-emerald-500",
};

const TYPE_BG: Record<ReminderType, string> = {
  follow_up: "bg-blue-500/10",
  interview: "bg-amber-500/10",
  offer:     "bg-emerald-500/10",
};

function dueLabel(isoDate: string): { text: string; overdue: boolean } {
  const d = parseISO(isoDate);
  const overdue = isPast(d) && !isToday(d);
  const text = overdue
    ? `Overdue · ${formatDistanceToNow(d, { addSuffix: false })} ago`
    : `Due ${formatDistanceToNow(d, { addSuffix: true })}`;
  return { text, overdue };
}

export function UpcomingReminders() {
  const sorted = [...UPCOMING_REMINDERS].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Upcoming</CardTitle>
          <Badge variant="secondary" className="text-[10px] h-5">
            {sorted.length} pending
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Follow-ups, interviews, deadlines</p>
      </CardHeader>
      <CardContent className="space-y-2 pt-1">
        {sorted.map((reminder, i) => {
          const Icon  = TYPE_ICON[reminder.type];
          const color = TYPE_COLOR[reminder.type];
          const bg    = TYPE_BG[reminder.type];
          const { text: dueText, overdue } = dueLabel(reminder.dueAt);

          return (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                "hover:bg-muted/50 cursor-pointer",
                reminder.urgent
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-border bg-transparent"
              )}
            >
              {/* Icon */}
              <div className={cn("mt-0.5 p-1.5 rounded-md shrink-0", bg)}>
                <Icon className={cn("w-3.5 h-3.5", color)} aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-foreground truncate">
                    {reminder.title}
                  </p>
                  {reminder.urgent && (
                    <AlertCircle
                      className="w-3 h-3 text-amber-500 shrink-0"
                      aria-label="Urgent"
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {reminder.subtitle}
                </p>
                <p
                  className={cn(
                    "text-[10px] font-medium mt-1",
                    overdue ? "text-co-score-low" : "text-muted-foreground"
                  )}
                >
                  {dueText}
                </p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
