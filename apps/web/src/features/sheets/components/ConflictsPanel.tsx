/**
 * Conflict resolution panel.
 * Shows each unresolved conflict with local vs remote values and resolution actions.
 */
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSheetsConflicts } from "../hooks/useSheetsStatus";
import { useResolveConflict } from "../hooks/useSheetsMutations";
import type { Conflict } from "../hooks/useSheetsStatus";
import { cn } from "@/lib/utils";

interface ConflictRowProps {
  conflict:  Conflict;
  onResolve: (id: string, resolution: "LOCAL_WINS" | "REMOTE_WINS", value: string) => void;
  isPending: boolean;
}

function ConflictRow({ conflict: c, onResolve, isPending }: ConflictRowProps) {
  const app = c.application;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-muted/20 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-sm font-medium">
            #{String(app.num).padStart(3, "0")} {app.company?.name ?? "—"} — {app.role}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(c.detectedAt), { addSuffix: true })}
        </span>
      </div>

      {/* Column conflict */}
      <div className="p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Column: <span className="text-foreground normal-case">{c.columnName}</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border/50 p-3 bg-background">
            <p className="text-xs font-medium text-muted-foreground mb-1">Local (DB)</p>
            <p className="text-sm font-mono break-all">{c.localValue || <em className="text-muted-foreground">empty</em>}</p>
          </div>
          <div className="rounded-md border border-amber-500/30 p-3 bg-amber-500/5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Remote (Sheets)</p>
            <p className="text-sm font-mono break-all">{c.remoteValue || <em className="text-muted-foreground">empty</em>}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5"
            disabled={isPending}
            onClick={() => onResolve(c.id, "LOCAL_WINS", c.localValue)}
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            Keep local
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5"
            disabled={isPending}
            onClick={() => onResolve(c.id, "REMOTE_WINS", c.remoteValue)}
          >
            <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
            Use Sheets
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ConflictsPanel() {
  const { data: conflicts, isLoading } = useSheetsConflicts();
  const resolve = useResolveConflict();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!conflicts?.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <CheckCircle className="h-8 w-8 text-emerald-400/50 mx-auto mb-2" />
        No unresolved conflicts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conflicts.map(c => (
        <ConflictRow
          key={c.id}
          conflict={c}
          isPending={resolve.isPending}
          onResolve={(id, resolution, value) =>
            resolve.mutate({ id, resolution, resolvedValue: value })
          }
        />
      ))}
    </div>
  );
}
