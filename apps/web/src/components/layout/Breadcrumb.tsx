/**
 * Breadcrumb — auto-generated from the current pathname.
 * Segments are capitalised and ID-like segments (cuid) are shown as "#num".
 */
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LABEL_MAP: Record<string, string> = {
  dashboard:    "Dashboard",
  applications: "Applications",
  companies:    "Companies",
  evaluations:  "Evaluations",
  documents:    "Documents",
  interviews:   "Interviews",
  queue:        "Queue",
  analytics:    "Analytics",
  reminders:    "Reminders",
  settings:     "Settings",
  profile:      "Profile",
  integrations: "Integrations",
  extension:    "Extension",
};

function labelFor(segment: string): string {
  return LABEL_MAP[segment] ?? (segment.length > 12 ? `#${segment.slice(0, 6)}…` : segment);
}

export function Breadcrumb() {
  const { pathname } = useLocation();

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const isLast = i === segments.length - 1;

          return (
            <li key={href} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  className="font-medium text-foreground truncate max-w-[200px]"
                  aria-current="page"
                >
                  {labelFor(seg)}
                </span>
              ) : (
                <Link
                  to={href}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    "truncate max-w-[120px]"
                  )}
                >
                  {labelFor(seg)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
