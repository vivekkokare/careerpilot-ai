/**
 * Sidebar — persistent left navigation on desktop.
 * Receives no props; uses useLocation() to highlight the active route.
 *
 * Navigation groups:
 *   Pipeline:     Dashboard, Applications, Companies
 *   Work:         Evaluations, Documents, Interviews
 *   Tools:        Queue, Analytics, Reminders
 *   System:       Settings
 */
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Zap,
  FileText,
  CalendarDays,
  Layers,
  BarChart3,
  Bell,
  Settings,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Pipeline",
    items: [
      { label: "Dashboard",    to: "/dashboard",    icon: LayoutDashboard },
      { label: "Applications", to: "/applications", icon: Briefcase },
      { label: "Companies",    to: "/companies",    icon: Building2 },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Evaluations", to: "/evaluations", icon: Zap },
      { label: "Documents",   to: "/documents",   icon: FileText },
      { label: "Interviews",  to: "/interviews",  icon: CalendarDays },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "AI Assistant", to: "/assistant", icon: Sparkles },
      { label: "Queue",        to: "/queue",      icon: Layers },
      { label: "Analytics",   to: "/analytics",  icon: BarChart3 },
      { label: "Reminders",   to: "/reminders",  icon: Bell },
    ],
  },
];

const BOTTOM_NAV: NavItem[] = [
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border shrink-0">
        <Target className="w-5 h-5 text-primary" aria-hidden="true" />
        <span className="font-semibold text-sm tracking-tight">career-ops</span>
      </div>

      {/* Nav items */}
      <ScrollArea className="flex-1 py-4">
        <nav aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-5 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <ul role="list">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <SidebarLink item={item} pathname={pathname} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom — settings */}
      <div className="shrink-0 border-t border-border py-3">
        <ul role="list">
          {BOTTOM_NAV.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = pathname === item.to || pathname.startsWith(item.to + "/");
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={cn(
        "flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}
