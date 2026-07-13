/**
 * Google Sheets sync settings panel — shown in Settings → Integrations.
 *
 * Sections:
 *   1. Connection (OAuth connect/disconnect + spreadsheet ID)
 *   2. Queue status (live job counts + offline queue)
 *   3. Conflict resolution (conflicts panel + strategy info)
 *   4. Sync log (recent job history)
 */
import { useState } from "react";
import {
  Sheet as SheetIcon, Link2, Link2Off, RefreshCw,
  Loader2, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { ConflictsPanel }  from "./ConflictsPanel";
import { SyncLogViewer }   from "./SyncLogViewer";
import { useSheetsStatus } from "../hooks/useSheetsStatus";
import { useTriggerSync, useDisconnectSheets } from "../hooks/useSheetsMutations";
import { cn } from "@/lib/utils";

// ── Section card ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-border/30",
          collapsible && "cursor-pointer select-none hover:bg-muted/20 transition-colors",
        )}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {badge}
        </div>
        {collapsible && (
          open ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
               : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Queue count badge ──────────────────────────────────────────────────────

function QueueBadge({ count, label, cls }: { count: number; label: string; cls: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border/50 bg-muted/10 p-3 min-w-[80px]">
      <span className={cn("text-2xl font-bold font-mono tabular-nums", cls)}>{count}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

// ── Strategy label ─────────────────────────────────────────────────────────

const STRATEGY_INFO: Record<string, { label: string; desc: string }> = {
  local_wins:  { label: "Local wins",  desc: "DB value always wins — preserves files-as-canonical doctrine." },
  remote_wins: { label: "Remote wins", desc: "Sheet value wins — useful for team-editing in Sheets." },
  manual:      { label: "Manual",      desc: "Conflicts are recorded for your review here before applying." },
};

// ── Main component ─────────────────────────────────────────────────────────

export function SheetsSettings() {
  const { data: status, isLoading } = useSheetsStatus();
  const syncMutation       = useTriggerSync();
  const disconnectMutation = useDisconnectSheets();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const strategyInfo = STRATEGY_INFO[status?.strategy ?? "local_wins"];

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <SheetIcon className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Google Sheets Sync</h2>
          <p className="text-xs text-muted-foreground">
            Mirror your applications tracker to a Google Spreadsheet in real-time.
          </p>
        </div>
        <div className="ml-auto">
          <SyncStatusBadge showLabel />
        </div>
      </div>

      {/* Connection */}
      <Section title="Connection">
        {!status?.enabled ? (
          <div className="text-sm text-muted-foreground py-2">
            Sheets sync is disabled. Set <code className="font-mono text-xs">SHEETS_ENABLED=true</code> in your <code className="font-mono text-xs">.env</code> to enable.
          </div>
        ) : status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Connected to Google</span>
              {status.tokenExpiry && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Token expires {formatDistanceToNow(new Date(status.tokenExpiry), { addSuffix: true })}
                </span>
              )}
            </div>

            {status.spreadsheetId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Spreadsheet:</span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${status.spreadsheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {status.tabName}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {status.lastSyncAt && (
              <p className="text-xs text-muted-foreground">
                Last sync: {formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RefreshCw className="h-3.5 w-3.5" />
                }
                Sync now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Disconnect Google Sheets? Existing sheet data won't be deleted.")) {
                    disconnectMutation.mutate();
                  }
                }}
                disabled={disconnectMutation.isPending}
              >
                <Link2Off className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Google account to sync applications to a spreadsheet.
            </p>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                window.location.href = "/api/v1/sheets/auth/google";
              }}
            >
              <SheetIcon className="h-3.5 w-3.5" />
              Connect Google Sheets
            </Button>
          </div>
        )}
      </Section>

      {/* Queue status */}
      {status?.enabled && status?.connected && (
        <Section title="Queue">
          <div className="space-y-4">
            <div className="flex gap-3">
              <QueueBadge count={status.queue?.waiting ?? 0} label="Waiting"  cls="text-blue-400" />
              <QueueBadge count={status.queue?.active  ?? 0} label="Active"   cls="text-amber-400" />
              <QueueBadge count={status.queue?.failed  ?? 0} label="Failed"   cls="text-red-400" />
              <QueueBadge count={status.offlineQueue   ?? 0} label="Offline"  cls="text-muted-foreground" />
            </div>

            {(status.offlineQueue ?? 0) > 0 && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-400">
                {status.offlineQueue} operations queued offline. They will replay automatically when the worker reconnects.
              </div>
            )}

            <div className="rounded-lg bg-muted/20 border border-border/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Strategy:</span>{" "}
              {strategyInfo.label} — {strategyInfo.desc}
            </div>
          </div>
        </Section>
      )}

      {/* Conflicts */}
      {status?.enabled && status?.connected && (
        <Section
          title="Conflicts"
          collapsible
          defaultOpen={(status.conflicts ?? 0) > 0}
          badge={
            (status.conflicts ?? 0) > 0
              ? <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {status.conflicts}
                </span>
              : undefined
          }
        >
          <ConflictsPanel />
        </Section>
      )}

      {/* Sync log */}
      {status?.enabled && status?.connected && (
        <Section title="Sync Log" collapsible defaultOpen={false}>
          <SyncLogViewer />
        </Section>
      )}
    </div>
  );
}
