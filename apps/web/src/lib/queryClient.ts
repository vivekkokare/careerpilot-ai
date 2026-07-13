import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes — matches the AiPromptCache TTL in the backend
      staleTime: 5 * 60 * 1000,
      // 10 minutes in the cache after last subscriber unmounts
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        // Never retry 4xx client errors — they won't resolve on retry
        if (apiError.status >= 400 && apiError.status < 500) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Don't retry mutations — they are not idempotent by default
      retry: false,
    },
  },
});
