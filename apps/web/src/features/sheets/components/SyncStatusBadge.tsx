/**
 * Compact status badge shown in the sidebar and settings header.
 * Three states: syncing (spinner), ok (green dot), error (red dot).
 */
import { Loader2, CheckCircle2, XCircle, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSheetsStatus } from "../hooks/useSheetsStatus";

interface SyncStatusBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function SyncStatusBadge({ className, showLabel = true }: SyncStatusBadgeProps) {
  const { data, isLoading } = useSheetsStatus();

  if (isLoading || !data?.enabled) return null;

  const { queue, offlineQueue, conflicts, connected, lastSyncAt } = data;
  const isSyncing   = (queue?.active ?? 0) > 0;
  const hasFailed   = (queue?.failed ?? 0) > 0;
  const hasOffline  = offlineQueue > 0;
  const hasConflict = conflicts > 0;

  let icon: React.ReactNode;
  let label: string;
  let cls: string;

  if (!connected) {
    icon  = <WifiOff className="h-3.5 w-3.5" />;
    label = "Not connected";
    cls   = "text-muted-foreground";
  } else if (isSyncing) {
    icon  = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    label = "Syncing…";
    cls   = "text-blue-400";
  } else if (hasFailed || hasOffline) {
    icon  = <XCircle className="h-3.5 w-3.5" />;
    label = hasOffline ? `${offlineQueue} offline` : "Sync error";
    cls   = "text-red-400";
  } else if (hasConflict) {
    icon  = <XCircle className="h-3.5 w-3.5" />;
    label = `${conflicts} conflict${conflicts !== 1 ? "s" : ""}`;
    cls   = "text-amber-400";
  } else {
    icon  = <CheckCircle2 className="h-3.5 w-3.5" />;
    label = lastSyncAt ? "Synced" : "Connected";
    cls   = "text-emerald-400";
  }

  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", cls, className)}>
      {icon}
      {showLabel && <span>{label}</span>}
    </span>
  );
}
