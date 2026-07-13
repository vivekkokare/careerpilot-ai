import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Application, StatusHistory, Note, Activity, AiEvaluation, Interview, Reminder } from "@/types/api";
import {
  MOCK_APPLICATIONS,
  MOCK_STATUS_HISTORY,
  MOCK_NOTES,
  MOCK_ACTIVITY,
  MOCK_EVALUATION,
  MOCK_INTERVIEW,
  MOCK_REMINDERS,
} from "../mockData";
import { APPLICATION_KEYS } from "./useApplications";

export interface ApplicationDetail {
  application:   Application;
  statusHistory: StatusHistory[];
  notes:         Note[];
  activity:      Activity[];
  evaluation:    AiEvaluation | null;
  interview:     Interview | null;
  reminders:     Reminder[];
}

async function fetchApplicationDetail(id: string): Promise<ApplicationDetail> {
  const [application, statusHistory, notes, activity, evaluation, interview, reminders] = await Promise.all([
    get<Application>(`/applications/${id}`),
    get<StatusHistory[]>(`/applications/${id}/status-history`),
    get<Note[]>(`/applications/${id}/notes`),
    get<Activity[]>(`/applications/${id}/activity`),
    get<AiEvaluation | null>(`/applications/${id}/evaluation`).catch(() => null),
    get<Interview | null>(`/applications/${id}/interview`).catch(() => null),
    get<Reminder[]>(`/applications/${id}/reminders`),
  ]);
  return { application, statusHistory, notes, activity, evaluation, interview, reminders };
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true" || import.meta.env.DEV;

export function useApplication(id: string) {
  return useQuery({
    queryKey: APPLICATION_KEYS.detail(id),
    queryFn: USE_MOCK
      ? () => {
          const app = MOCK_APPLICATIONS.find(a => a.id === id) ?? MOCK_APPLICATIONS[0]!;
          return Promise.resolve<ApplicationDetail>({
            application:   app,
            statusHistory: MOCK_STATUS_HISTORY,
            notes:         MOCK_NOTES,
            activity:      MOCK_ACTIVITY,
            evaluation:    MOCK_EVALUATION,
            interview:     MOCK_INTERVIEW,
            reminders:     MOCK_REMINDERS,
          });
        }
      : () => fetchApplicationDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
