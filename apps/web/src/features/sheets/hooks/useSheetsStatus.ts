import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";

export interface SheetsStatus {
  enabled:       boolean;
  connected:     boolean;
  tokenExpiry:   string | null;
  spreadsheetId: string | null;
  tabName:       string;
  lastSyncAt:    string | null;
  syncEnabled:   boolean;
  queue:         { waiting: number; active: number; failed: number };
  offlineQueue:  number;
  conflicts:     number;
  strategy:      "local_wins" | "remote_wins" | "manual";
}

export interface SheetsConfig {
  enabled:          boolean;
  tabName:          string;
  autoSync:         boolean;
  syncIntervalMs:   number;
  maxRetries:       number;
  retryBaseDelayMs: number;
  conflictStrategy: string;
}

export interface SyncLog {
  id:          string;
  type:        string;
  status:      "completed" | "failed";
  completedAt?: string | null;
  failedAt?:   string | null;
  duration?:   number | null;
  reason?:     string;
  attempts?:   number;
}

export interface Conflict {
  id:             string;
  sheetMappingId: string;
  applicationId:  string;
  columnName:     string;
  localValue:     string;
  remoteValue:    string;
  resolution:     "UNRESOLVED" | "LOCAL_WINS" | "REMOTE_WINS" | "MANUAL";
  resolvedValue?: string;
  resolvedAt?:    string;
  detectedAt:     string;
  application: {
    num:    number;
    role:   string;
    company: { name: string } | null;
  };
}

export const SHEETS_KEYS = {
  status:    () => ["sheets", "status"]    as const,
  config:    () => ["sheets", "config"]    as const,
  conflicts: () => ["sheets", "conflicts"] as const,
  logs:      () => ["sheets", "logs"]      as const,
};

export function useSheetsStatus() {
  return useQuery({
    queryKey: SHEETS_KEYS.status(),
    queryFn:  () => get<SheetsStatus>("/sheets/status"),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useSheetsConfig() {
  return useQuery({
    queryKey: SHEETS_KEYS.config(),
    queryFn:  () => get<SheetsConfig>("/sheets/config"),
    staleTime: 60_000,
  });
}

export function useSheetsConflicts() {
  return useQuery({
    queryKey: SHEETS_KEYS.conflicts(),
    queryFn:  () => get<{ conflicts: Conflict[] }>("/sheets/conflicts").then(r => r.conflicts),
    staleTime: 30_000,
  });
}

export function useSyncLogs() {
  return useQuery({
    queryKey: SHEETS_KEYS.logs(),
    queryFn:  () => get<{ logs: SyncLog[] }>("/sheets/logs").then(r => r.logs),
    refetchInterval: 10_000,
  });
}
