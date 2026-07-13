import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";

/** shadcn/ui canonical class merger — use everywhere instead of raw clsx. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a score (0–5) to one decimal place. */
export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toFixed(1);
}

/** Convert a 0–5 score to a Tailwind color token string. */
export function scoreColorClass(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 4.0) return "text-co-score-high";
  if (score >= 3.0) return "text-co-score-mid";
  return "text-co-score-low";
}

/** Convert a 0–5 score to a CSS percentage for score bars. */
export function scoreToPercent(score: number | null | undefined): string {
  if (score == null) return "0%";
  return `${Math.round((score / 5) * 100)}%`;
}

/** Format a date string as "Jul 11, 2026". */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return format(parseISO(dateStr), "MMM d, yyyy");
}

/** Format a date string as relative time ("3 days ago"). */
export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

/** Format currency amount (in cents) to a human-readable string. */
export function formatCurrency(
  amountCents: number | null | undefined,
  currency = "USD"
): string {
  if (amountCents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

/** Derive a short company slug from a name. */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Truncate a string to maxLength with ellipsis. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/** Extract initials from a full name. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
