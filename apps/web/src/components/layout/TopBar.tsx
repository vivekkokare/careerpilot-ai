/**
 * TopBar — sticky header bar above the main content area.
 * Contains: skip-link, hamburger (mobile), breadcrumb, theme toggle, user menu.
 */
import { Menu, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "./Breadcrumb";
import { useTheme } from "@/providers/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Skip-to-content link — first focusable element, screen-reader accessible */}
      <a
        href="#main-content"
        className={[
          "sr-only focus:not-sr-only",
          "focus:absolute focus:top-2 focus:left-2 focus:z-50",
          "focus:px-4 focus:py-2 focus:rounded focus:bg-primary focus:text-primary-foreground",
          "focus:text-sm focus:font-medium",
        ].join(" ")}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center h-full px-4 gap-4">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0">
            <Breadcrumb />
          </div>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle theme">
                {theme === "dark" && <Moon className="w-4 h-4" />}
                {theme === "light" && <Sun className="w-4 h-4" />}
                {theme === "system" && <Monitor className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="w-4 h-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="w-4 h-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
