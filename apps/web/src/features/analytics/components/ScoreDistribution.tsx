/**
 * ScoreDistribution — histogram of global scores grouped into 0.5-wide buckets.
 * Uses Recharts BarChart. The bucket containing the average score is highlighted.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_HISTOGRAM, STATS } from "../mockData";

const AVG_BUCKET_INDEX = (() => {
  const avg = STATS.avgScore;
  return SCORE_HISTOGRAM.findIndex((b) => {
    const [lo] = b.bucket.split("–").map(parseFloat);
    return avg !== undefined && lo !== undefined && avg >= lo && avg < lo + 0.5;
  });
})();

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} applications</p>
    </div>
  );
}

export function ScoreDistribution() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Score Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">
          Average global score:{" "}
          <span className="font-semibold text-foreground">{STATS.avgScore.toFixed(1)}/5</span>
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={SCORE_HISTOGRAM}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={40}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <RechartTooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {SCORE_HISTOGRAM.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    i === AVG_BUCKET_INDEX
                      ? "hsl(38 92% 50%)"        // highlighted bucket = amber
                      : i >= 5
                      ? "hsl(142 71% 45%)"       // ≥ 3.5 = green
                      : i <= 1
                      ? "hsl(0 84% 60%)"         // ≤ 1.5 = red
                      : "hsl(217 91% 60%)"       // mid = blue
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
