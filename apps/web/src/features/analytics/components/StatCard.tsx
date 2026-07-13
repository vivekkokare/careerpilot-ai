/**
 * StatCard — animated KPI card with icon, value, label, and optional delta.
 * Value counts up from 0 on mount using Framer Motion's useMotionValue.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  iconColor?: string;
  delta?: { value: number; label: string } | null;
  format?: "number" | "percent" | "score";
  className?: string;
  delay?: number;
}

function useCountUp(target: number, duration = 900, delay = 0): number {
  const [current, setCurrent] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return current;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-muted-foreground",
  delta,
  format = "number",
  className,
  delay = 0,
}: StatCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const counted = useCountUp(numericValue, 900, delay);

  const displayValue =
    format === "percent" ? `${counted}%`
    : format === "score"   ? (counted / 10).toFixed(1)
    : counted.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: "easeOut" }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground leading-none">
              {label}
            </p>
            <div className={cn("p-1.5 rounded-md bg-muted/60", iconColor)}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <p className="text-2xl font-bold tracking-tight text-foreground">
            {displayValue}
          </p>

          {delta != null && (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium",
                delta.value >= 0 ? "text-co-score-high" : "text-co-score-low"
              )}
            >
              {delta.value >= 0 ? "↑" : "↓"} {Math.abs(delta.value)} {delta.label}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
