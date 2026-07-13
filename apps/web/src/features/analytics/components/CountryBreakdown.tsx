/**
 * CountryBreakdown — horizontal bar rows per country, showing evaluated vs applied counts.
 * Two stacked mini-bars per row: evaluated (full width reference) and applied (subset).
 */
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { COUNTRY_DATA } from "../mockData";

const MAX_COUNT = Math.max(...COUNTRY_DATA.map((d) => d.count));

export function CountryBreakdown() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Country Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">Evaluated vs applied per market</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <TooltipProvider delayDuration={100}>
          {COUNTRY_DATA.map((row, i) => {
            const evalPct  = (row.count   / MAX_COUNT) * 100;
            const applyPct = (row.applied / MAX_COUNT) * 100;
            const convRate = ((row.applied / row.count) * 100).toFixed(0);

            return (
              <Tooltip key={row.country}>
                <TooltipTrigger asChild>
                  <div className="cursor-default">
                    {/* Country name row */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground flex items-center gap-1.5">
                        <span aria-hidden="true">{row.flag}</span>
                        {row.country}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {row.applied}/{row.count}
                      </span>
                    </div>

                    {/* Double-bar track */}
                    <div className="relative h-4 bg-muted/50 rounded-sm overflow-hidden">
                      {/* Evaluated bar (background) */}
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-blue-500/20 rounded-sm"
                        initial={{ width: "0%" }}
                        animate={{ width: `${evalPct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                      />
                      {/* Applied bar (foreground) */}
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-emerald-500/70 rounded-sm"
                        initial={{ width: "0%" }}
                        animate={{ width: `${applyPct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06 + 0.15, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <p className="font-semibold">{row.country}</p>
                  <p>{row.count} evaluated · {row.applied} applied ({convRate}% rate)</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-block w-3 h-2 rounded-sm bg-blue-500/20" />
            Evaluated
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-block w-3 h-2 rounded-sm bg-emerald-500/70" />
            Applied
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
