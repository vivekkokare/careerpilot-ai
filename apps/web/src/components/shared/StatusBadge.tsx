/**
 * StatusBadge — colour-coded pill for ApplicationStatus values.
 * Colours are designed for both light and dark mode.
 */
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/api";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  EVALUATED:  "bg-blue-500/15 text-blue-500 border-blue-500/30",
  APPLIED:    "bg-violet-500/15 text-violet-500 border-violet-500/30",
  RESPONDED:  "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  INTERVIEW:  "bg-amber-500/15 text-amber-500 border-amber-500/30",
  OFFER:      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  REJECTED:   "bg-red-500/15 text-red-500 border-red-500/30",
  DISCARDED:  "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  SKIP:       "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  HIRED:      "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 font-semibold",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  EVALUATED:  "Evaluated",
  APPLIED:    "Applied",
  RESPONDED:  "Responded",
  INTERVIEW:  "Interview",
  OFFER:      "Offer",
  REJECTED:   "Rejected",
  DISCARDED:  "Discarded",
  SKIP:       "Skip",
  HIRED:      "Hired",
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs border",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
