import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, del } from "@/lib/api";
import type { Application, ApplicationStatus } from "@/types/api";
import { APPLICATION_KEYS } from "./useApplications";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CreateApplicationInput {
  role:         string;
  companyName:  string;
  jdUrl?:       string;
  trackerNotes?: string;
}

export interface UpdateApplicationInput {
  role?:         string;
  trackerNotes?: string;
  status?:       ApplicationStatus;
  score?:        number;
}

// ── Create ─────────────────────────────────────────────────────────────────

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApplicationInput) =>
      post<Application>("/applications", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.lists() });
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────────────

export function useUpdateApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplicationInput) =>
      patch<Application>(`/applications/${id}`, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: APPLICATION_KEYS.detail(id) });
      const prev = qc.getQueryData(APPLICATION_KEYS.detail(id));
      qc.setQueryData(APPLICATION_KEYS.detail(id), (old: any) =>
        old ? { ...old, application: { ...old.application, ...data } } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(APPLICATION_KEYS.detail(id), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.lists() });
    },
  });
}

// ── Status change (shells out to set-status.mjs via API) ──────────────────

export function useUpdateStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, note }: { status: ApplicationStatus; note?: string }) =>
      post<{ ok: boolean }>(`/applications/${id}/status`, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.lists() });
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────────────

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/applications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.lists() });
    },
  });
}

// ── Notes ──────────────────────────────────────────────────────────────────

export function useAddNote(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      post(`/applications/${applicationId}/notes`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.detail(applicationId) });
    },
  });
}

export function useDeleteNote(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) =>
      del(`/applications/${applicationId}/notes/${noteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APPLICATION_KEYS.detail(applicationId) });
    },
  });
}
