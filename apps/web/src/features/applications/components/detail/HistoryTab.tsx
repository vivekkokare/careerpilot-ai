import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { ApplicationDetail } from "../../hooks/useApplication";

export function HistoryTab({ data }: { data: ApplicationDetail }) {
  const { statusHistory } = data;
  const sorted = [...statusHistory].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground py-16">
        No status changes recorded.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-sm font-semibold mb-4">Status history</h3>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Change</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Source</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Note</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(row.occurredAt), "MMM d, yyyy")}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {row.fromStatus && <StatusBadge status={row.fromStatus} />}
                    {row.fromStatus && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    <StatusBadge status={row.toStatus} />
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{row.source ?? "—"}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{row.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
