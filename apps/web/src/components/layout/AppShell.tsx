/**
 * AppShell — the persistent chrome around all authenticated pages.
 *
 * Layout:
 *   ┌─────────────────────────────────────────┐
 *   │  Sidebar (desktop)  │  TopBar            │
 *   │  (w-64, fixed)      │  (h-14, sticky)    │
 *   │                     ├────────────────────│
 *   │                     │  <Outlet />        │
 *   │                     │  (scrollable main) │
 *   └─────────────────────┴────────────────────┘
 *
 * On mobile (< lg): Sidebar is hidden; TopBar shows hamburger → MobileNav sheet.
 */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Desktop sidebar (hidden on mobile) ────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-card">
        <Sidebar />
      </aside>

      {/* ── Mobile nav sheet ───────────────────────────────────────────────── */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* ── Main content area ──────────────────────────────────────────────── */}
      <div className={cn("flex flex-col flex-1 min-w-0", "lg:pl-64")}>
        {/* Top bar */}
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />

        {/* Page content — scrollable, padded */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          // Accessibility: main landmark for skip-to-content
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
