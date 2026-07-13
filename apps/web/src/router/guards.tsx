/**
 * Route guards — used as wrapper components in the router config.
 *
 * AuthGuard:   Redirects to /login when VITE_AUTH_MODE=jwt and no token found.
 *              Passes through immediately when VITE_AUTH_MODE=none.
 *
 * GuestGuard:  Redirects to /dashboard when already authenticated.
 *              Used on the /login route so signed-in users skip it.
 */
import { Navigate, Outlet } from "react-router-dom";
import { tokenStore } from "@/lib/api";

const AUTH_MODE = import.meta.env["VITE_AUTH_MODE"] ?? "none";

export function AuthGuard() {
  if (AUTH_MODE === "none") {
    // Local mode — no auth required, always allow
    return <Outlet />;
  }

  const hasToken = !!tokenStore.get();
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function GuestGuard() {
  if (AUTH_MODE === "none") {
    // Local mode — skip login page entirely
    return <Navigate to="/dashboard" replace />;
  }

  const hasToken = !!tokenStore.get();
  if (hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
