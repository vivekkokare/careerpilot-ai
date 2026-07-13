/**
 * Settings — tabbed layout: Profile · Integrations · Extension.
 * Each tab is a separate sub-page but shares this outer shell.
 */
import { Settings } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const TABS = [
  { label: "Profile",      to: "/settings/profile" },
  { label: "Integrations", to: "/settings/integrations" },
  { label: "Extension",    to: "/settings/extension" },
];

export default function SettingsPage() {
  const { pathname } = useLocation();
  const isRoot = pathname === "/settings";

  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile, integrations, and extension config" />

      {/* Tab nav */}
      <nav className="flex gap-1 border-b border-border mb-6" aria-label="Settings sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Content — Outlet renders the active settings sub-page */}
      <Card>
        <CardContent className="pt-6">
          {isRoot ? (
            <p className="text-sm text-muted-foreground">Select a settings section above.</p>
          ) : (
            <Outlet />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
