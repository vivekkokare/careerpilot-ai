/**
 * ApplicationTimeline — area chart of evaluations vs applications per week.
 * Recharts AreaChart with two series, custom dot, custom tooltip.
 */
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIMELINE_DATA } from "../mockData";

type Window = "12w" | "24w";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md space-y-1 min-w-[120px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 justify-between">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold text-foreground tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ApplicationTimeline() {
  const [window, setWindow] = useState<Window>("24w");
  const data = window === "12w" ? TIMELINE_DATA.slice(-12) : TIMELINE_DATA;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Applications over Time</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Weekly evaluations and applications sent</p>
        </div>
        <Tabs value={window} onValueChange={(v) => setWindow(v as Window)}>
          <TabsList className="h-7">
            <TabsTrigger value="12w" className="text-xs px-2 py-0.5">12 wks</TabsTrigger>
            <TabsTrigger value="24w" className="text-xs px-2 py-0.5">24 wks</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradEvaluated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(217 91% 60%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradApplied" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(142 71% 45%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval={window === "24w" ? 3 : 1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <RechartTooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="evaluated"
              name="Evaluated"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2}
              fill="url(#gradEvaluated)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(217 91% 60%)" }}
            />
            <Area
              type="monotone"
              dataKey="applied"
              name="Applied"
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              fill="url(#gradApplied)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(142 71% 45%)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
