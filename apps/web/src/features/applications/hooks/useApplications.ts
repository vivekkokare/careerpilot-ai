import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { PaginatedResponse, Application, ApplicationFilters } from "@/types/api";
import { MOCK_APPLICATIONS } from "../mockData";

export const APPLICATION_KEYS = {
  all:    () => ["applications"] as const,
  lists:  () => [...APPLICATION_KEYS.all(), "list"] as const,
  list:   (filters: ApplicationFilters) => [...APPLICATION_KEYS.lists(), filters] as const,
  detail: (id: string) => [...APPLICATION_KEYS.all(), "detail", id] as const,
};

async function fetchApplications(filters: ApplicationFilters): Promise<PaginatedResponse<Application>> {
  const params = new URLSearchParams();
  if (filters.search)     params.set("search", filters.search);
  if (filters.status?.length)    params.set("status", filters.status.join(","));
  if (filters.archetype?.length) params.set("archetype", filters.archetype.join(","));
  if (filters.scoreMin != null)  params.set("scoreMin", String(filters.scoreMin));
  if (filters.scoreMax != null)  params.set("scoreMax", String(filters.scoreMax));
  if (filters.dateFrom)   params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo)     params.set("dateTo", filters.dateTo);
  if (filters.sort)       params.set("sort", filters.sort);
  if (filters.order)      params.set("order", filters.order);
  if (filters.page)       params.set("page", String(filters.page));
  if (filters.pageSize)   params.set("pageSize", String(filters.pageSize));
  return get<PaginatedResponse<Application>>(`/applications?${params.toString()}`);
}

function filterMock(apps: Application[], f: ApplicationFilters): PaginatedResponse<Application> {
  let result = [...apps];
  if (f.search) {
    const q = f.search.toLowerCase();
    result = result.filter(a =>
      a.role.toLowerCase().includes(q) || a.company?.name.toLowerCase().includes(q)
    );
  }
  if (f.status?.length) result = result.filter(a => f.status!.includes(a.status));
  if (f.archetype?.length) result = result.filter(a => a.archetypeA && f.archetype!.includes(a.archetypeA));
  if (f.scoreMin != null) result = result.filter(a => (a.score ?? 0) >= f.scoreMin!);
  if (f.scoreMax != null) result = result.filter(a => (a.score ?? 0) <= f.scoreMax!);

  if (f.sort) {
    const dir = f.order === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (f.sort === "score")       return ((a.score ?? 0) - (b.score ?? 0)) * dir;
      if (f.sort === "num")         return (a.num - b.num) * dir;
      if (f.sort === "role")        return a.role.localeCompare(b.role) * dir;
      if (f.sort === "company")     return (a.company?.name ?? "").localeCompare(b.company?.name ?? "") * dir;
      if (f.sort === "updatedAt")   return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      return 0;
    });
  }

  const page     = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  const total    = result.length;
  const items    = result.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true" || import.meta.env.DEV;

export function useApplications(filters: ApplicationFilters = {}) {
  return useQuery({
    queryKey: APPLICATION_KEYS.list(filters),
    queryFn:  USE_MOCK
      ? () => Promise.resolve(filterMock(MOCK_APPLICATIONS, filters))
      : ()  => fetchApplications(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
