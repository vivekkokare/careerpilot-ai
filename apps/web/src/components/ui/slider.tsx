import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  min:            number;
  max:            number;
  step:           number;
  value:          [number, number];
  onValueChange:  (value: [number, number]) => void;
  className?:     string;
}

export function Slider({ min, max, step, value, onValueChange, className }: SliderProps) {
  const [lo, hi] = value;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-3 items-center">
        <input
          type="range" min={min} max={max} step={step} value={lo}
          onChange={e => {
            const v = parseFloat(e.target.value);
            onValueChange([Math.min(v, hi), hi]);
          }}
          className="flex-1 accent-primary"
        />
        <span className="text-xs text-muted-foreground w-8 text-right font-mono">{lo}</span>
      </div>
      <div className="flex gap-3 items-center">
        <input
          type="range" min={min} max={max} step={step} value={hi}
          onChange={e => {
            const v = parseFloat(e.target.value);
            onValueChange([lo, Math.max(v, lo)]);
          }}
          className="flex-1 accent-primary"
        />
        <span className="text-xs text-muted-foreground w-8 text-right font-mono">{hi}</span>
      </div>
    </div>
  );
}
