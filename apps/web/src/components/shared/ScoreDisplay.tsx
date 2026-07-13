/**
 * ScoreDisplay — renders a 0–5 score with animated fill bar and colour coding.
 *
 * Variants:
 *   "compact"  → just the number, no bar  (for table cells)
 *   "bar"      → number + animated fill bar (for cards)
 *   "ring"     → circular SVG ring (for hero score on detail page)
 */
import { motion } from "framer-motion";
import { cn, formatScore, scoreColorClass, scoreToPercent } from "@/lib/utils";

type Variant = "compact" | "bar" | "ring";

interface ScoreDisplayProps {
  score: number | null | undefined;
  variant?: Variant;
  label?: string;
  className?: string;
}

export function ScoreDisplay({
  score,
  variant = "compact",
  label,
  className,
}: ScoreDisplayProps) {
  if (variant === "compact") {
    return (
      <span className={cn("font-mono text-sm font-medium", scoreColorClass(score), className)}>
        {formatScore(score)}
      </span>
    );
  }

  if (variant === "bar") {
    const pct = score != null ? (score / 5) * 100 : 0;
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span className={cn("font-mono text-lg font-semibold w-10", scoreColorClass(score))}>
          {formatScore(score)}
        </span>
        <div
          className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={score ?? 0}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label={label ?? "Score"}
        >
          <motion.div
            className={cn(
              "h-full rounded-full",
              score == null || score < 3 ? "bg-co-score-low"
              : score < 4 ? "bg-co-score-mid"
              : "bg-co-score-high"
            )}
            initial={{ width: "0%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      </div>
    );
  }

  // "ring" variant — SVG circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = score != null ? score / 5 : 0;
  const dash = circumference * pct;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg width="100" height="100" aria-hidden="true">
        {/* Background track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth="8"
        />
        {/* Animated fill */}
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn(
            score == null || score < 3 ? "stroke-co-score-low"
            : score < 4 ? "stroke-co-score-mid"
            : "stroke-co-score-high"
          )}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 50 50)"
        />
        {/* Score text */}
        <text
          x="50" y="55"
          textAnchor="middle"
          className="text-xl font-bold fill-foreground font-mono"
          fontSize="22"
        >
          {formatScore(score)}
        </text>
      </svg>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
