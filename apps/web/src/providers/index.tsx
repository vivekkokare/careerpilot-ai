/**
 * Root provider tree — order matters:
 *   ThemeProvider   → must wrap everything (controls <html> class)
 *   QueryProvider   → React Query context
 *
 * All other providers (Toasts, command palette, etc.) are added here
 * as the app grows so main.tsx stays clean.
 */
import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  );
}
