/**
 * Application router — createBrowserRouter (React Router v6 Data API).
 *
 * All page components are lazy-loaded so the initial bundle stays small.
 * The chunk names in the dynamic imports map to the manualChunks in vite.config.ts.
 *
 * Route tree:
 *
 *   /                         → redirect to /dashboard
 *   /login                    → LoginPage          [GuestGuard]
 *   /                         → AppShell           [AuthGuard]
 *     /dashboard              → DashboardPage
 *     /applications           → ApplicationsPage
 *     /applications/:id       → ApplicationDetailPage
 *     /companies              → CompaniesPage
 *     /companies/:id          → CompanyDetailPage
 *     /evaluations            → EvaluationsPage
 *     /documents              → DocumentsPage
 *     /interviews             → InterviewsPage
 *     /interviews/:id         → InterviewDetailPage
 *     /queue                  → QueuePage
 *     /analytics              → AnalyticsPage
 *     /reminders              → RemindersPage
 *     /assistant              → AssistantPage
 *     /settings               → SettingsPage
 *     /settings/profile       → SettingsProfilePage
 *     /settings/integrations  → SettingsIntegrationsPage
 *     /settings/extension     → SettingsExtensionPage
 *   *                         → NotFoundPage
 */
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthGuard, GuestGuard } from "./guards";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoader } from "@/components/shared/PageLoader";

// Lazy-loaded pages
const LoginPage              = lazy(() => import("@/pages/LoginPage"));
const DashboardPage          = lazy(() => import("@/pages/DashboardPage"));
const ApplicationsPage       = lazy(() => import("@/pages/ApplicationsPage"));
const ApplicationDetailPage  = lazy(() => import("@/pages/ApplicationDetailPage"));
const CompaniesPage          = lazy(() => import("@/pages/CompaniesPage"));
const CompanyDetailPage      = lazy(() => import("@/pages/CompanyDetailPage"));
const EvaluationsPage        = lazy(() => import("@/pages/EvaluationsPage"));
const DocumentsPage          = lazy(() => import("@/pages/DocumentsPage"));
const InterviewsPage         = lazy(() => import("@/pages/InterviewsPage"));
const InterviewDetailPage    = lazy(() => import("@/pages/InterviewDetailPage"));
const QueuePage              = lazy(() => import("@/pages/QueuePage"));
const AnalyticsPage          = lazy(() => import("@/pages/AnalyticsPage"));
const RemindersPage          = lazy(() => import("@/pages/RemindersPage"));
const SettingsPage           = lazy(() => import("@/pages/SettingsPage"));
const IntegrationsPage       = lazy(() => import("@/pages/IntegrationsPage"));
const AssistantPage          = lazy(() => import("@/pages/AssistantPage"));
const NotFoundPage           = lazy(() => import("@/pages/NotFoundPage"));

// Wrap a lazy page in Suspense — used inline per route element
function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  // ── Root redirect ──────────────────────────────────────────────────────────
  {
    index: true,
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },

  // ── Guest-only routes (login) ──────────────────────────────────────────────
  {
    element: <GuestGuard />,
    children: [
      {
        path: "/login",
        element: <Lazy><LoginPage /></Lazy>,
      },
    ],
  },

  // ── Authenticated routes (inside AppShell) ─────────────────────────────────
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard",          element: <Lazy><DashboardPage /></Lazy> },
          { path: "/applications",       element: <Lazy><ApplicationsPage /></Lazy> },
          { path: "/applications/:id",   element: <Lazy><ApplicationDetailPage /></Lazy> },
          { path: "/companies",          element: <Lazy><CompaniesPage /></Lazy> },
          { path: "/companies/:id",      element: <Lazy><CompanyDetailPage /></Lazy> },
          { path: "/evaluations",        element: <Lazy><EvaluationsPage /></Lazy> },
          { path: "/documents",          element: <Lazy><DocumentsPage /></Lazy> },
          { path: "/interviews",         element: <Lazy><InterviewsPage /></Lazy> },
          { path: "/interviews/:id",     element: <Lazy><InterviewDetailPage /></Lazy> },
          { path: "/queue",              element: <Lazy><QueuePage /></Lazy> },
          { path: "/analytics",          element: <Lazy><AnalyticsPage /></Lazy> },
          { path: "/reminders",          element: <Lazy><RemindersPage /></Lazy> },
          { path: "/assistant",          element: <Lazy><AssistantPage /></Lazy> },
          {
            path: "/settings",
            element: <Lazy><SettingsPage /></Lazy>,
            children: [
              { index: true, element: <Navigate to="/settings/profile" replace /> },
              { path: "profile",      element: <></> },
              { path: "integrations", element: <Lazy><IntegrationsPage /></Lazy> },
              { path: "extension",    element: <></> },
            ],
          },
        ],
      },
    ],
  },

  // ── 404 ────────────────────────────────────────────────────────────────────
  {
    path: "*",
    element: <Lazy><NotFoundPage /></Lazy>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
