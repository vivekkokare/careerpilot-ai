/**
 * Sync log viewer — recent 50 completed/failed BullMQ jobs.
 * Auto-refreshes every 10 seconds while mounted.
 */
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSyncLogs } from "../hooks/useSheetsStatus";
import { useQueryClient } from "@tanstack/react-query";
import { SHEETS_KEYS } from "../hooks/useSheetsStatus";

const TYPE_LABELS: Record<string, string> = {
  UPSERT_ROW:    "Row upserted",
  DELETE_ROW:    "Row deleted",
  FULL_SYNC:     "Full sync",
  DRAIN_OFFLINE: "Offline drain",
};

export function SyncLogViewer() {
  const { data: logs, isLoading, isFetching } = useSyncLogs();
  const qc = useQueryClient();

  const refresh = () => qc.invalidateQueries({ queryKey: SHEETS_KEYS.logs() });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Recent jobs {logs?.length ? `(${logs.length})` : ""}
        </p>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={refresh}>
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>

      {!logs?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">No sync history yet.</p>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden divide-y divide-border/30">
          {logs.map((log) => {
            const isOk = log.status === "completed";
            const ts   = log.completedAt ?? log.failedAt;

            return (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                {isOk
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  : <XCircle     className="h-4 w-4 text-red-400 shrink-0" />
                }

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {TYPE_LABELS[log.type] ?? log.type}
                  </p>
                  {!isOk && log.reason && (
                    <p className="text-xs text-red-400 truncate">{log.reason}</p>
                  )}
                </div>

                <div className="flex flex-col items-end shrink-0 text-xs text-muted-foreground">
                  {ts && <span>{formatDistanceToNow(new Date(ts), { addSuffix: true })}</span>}
                  {isOk && log.duration && (
                    <span className="text-muted-foreground/60">{log.duration}ms</span>
                  )}
                  {!isOk && log.attempts && (
                    <span className="text-red-400/60">{log.attempts} attempt{log.attempts !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
