import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, del } from "@/lib/api";
import { SHEETS_KEYS } from "./useSheetsStatus";

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<{ ok: boolean; message: string }>("/sheets/sync", {}),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: SHEETS_KEYS.status() });
      qc.invalidateQueries({ queryKey: SHEETS_KEYS.logs() });
    },
  });
}

export function useResolveConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      resolution,
      resolvedValue,
    }: {
      id: string;
      resolution: "LOCAL_WINS" | "REMOTE_WINS" | "MANUAL";
      resolvedValue: string;
    }) => patch<{ ok: boolean }>(`/sheets/conflicts/${id}`, { resolution, resolvedValue }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHEETS_KEYS.conflicts() });
      qc.invalidateQueries({ queryKey: SHEETS_KEYS.status() });
    },
  });
}

export function useDisconnectSheets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => del<{ ok: boolean }>("/sheets/auth"),
    onSuccess:  () => qc.invalidateQueries({ queryKey: SHEETS_KEYS.status() }),
  });
}
