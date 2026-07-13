/**
 * Axios instance — single source of truth for all API calls.
 *
 * Responsibilities:
 *   1. Base URL from VITE_API_URL (or Vite dev proxy at /api)
 *   2. Attach JWT Bearer token from localStorage on every request
 *   3. Normalise error responses into ApiError instances
 *   4. 401 → clear token + redirect to /login (cloud mode only)
 */
import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasNextPage?: boolean;
  };
}

// ── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_KEY = "co_access_token";

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// ── Axios instance ────────────────────────────────────────────────────────────

export const api = axios.create({
  // In dev, Vite proxies /api → http://localhost:3001. In production,
  // set VITE_API_URL to the full backend URL (e.g. https://api.career-ops.io).
  baseURL: import.meta.env["VITE_API_URL"]
    ? `${import.meta.env["VITE_API_URL"]}/api/v1`
    : "/api/v1",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach auth token ──────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — normalise errors ──────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ code?: string; message?: string; details?: unknown }>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    const apiError: ApiError = {
      status,
      code: body?.code ?? "UNKNOWN_ERROR",
      message: body?.message ?? error.message ?? "An unexpected error occurred",
      details: body?.details,
    };

    // In cloud auth mode, a 401 means the session expired.
    const authMode = import.meta.env["VITE_AUTH_MODE"] ?? "none";
    if (status === 401 && authMode !== "none") {
      tokenStore.clear();
      window.location.href = "/login";
    }

    return Promise.reject(apiError);
  }
);

// ── Convenience wrappers ─────────────────────────────────────────────────────

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function del<T>(url: string): Promise<T> {
  const res = await api.delete<ApiResponse<T>>(url);
  return res.data.data;
}
