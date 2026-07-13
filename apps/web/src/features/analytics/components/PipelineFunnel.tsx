/**
 * PipelineFunnel — horizontal bar chart showing drop-off at each pipeline stage.
 * Bars animate in on mount. Conversion rate shown between stages.
 */
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { FUNNEL_DATA } from "../mockData";

const MAX = FUNNEL_DATA[0]?.count ?? 1;

function conversionRate(a: number, b: number): string {
  return `${((b / a) * 100).toFixed(1)}%`;
}

export function PipelineFunnel() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Pipeline Funnel</CardTitle>
        <p className="text-xs text-muted-foreground">Drop-off at each stage</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <TooltipProvider delayDuration={100}>
          {FUNNEL_DATA.map((row, i) => {
            const pct = (row.count / MAX) * 100;
            const prev = FUNNEL_DATA[i - 1];
            const rate = prev ? conversionRate(prev.count, row.count) : null;

            return (
              <div key={row.stage}>
                {/* Conversion label between stages */}
                {rate && (
                  <p className="text-[10px] text-muted-foreground text-right mb-0.5 pr-1">
                    {rate} conversion
                  </p>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 cursor-default">
                      {/* Stage label */}
                      <span className="text-xs text-muted-foreground w-20 shrink-0 text-right">
                        {row.stage}
                      </span>

                      {/* Bar track */}
                      <div className="flex-1 h-6 bg-muted/50 rounded-md overflow-hidden">
                        <motion.div
                          className="h-full rounded-md flex items-center pl-2"
                          style={{ backgroundColor: row.fill }}
                          initial={{ width: "0%" }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                        />
                      </div>

                      {/* Count */}
                      <span className="text-xs font-semibold tabular-nums w-10 shrink-0">
                        {row.count.toLocaleString()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {row.count.toLocaleString()} applications in {row.stage} stage
                    {rate && ` (${rate} from previous)`}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
