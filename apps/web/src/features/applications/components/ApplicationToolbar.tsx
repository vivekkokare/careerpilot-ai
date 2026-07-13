import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ApplicationFilters } from "@/types/api";

interface ApplicationToolbarProps {
  filters:          ApplicationFilters;
  activeFilterCount: number;
  onSearchChange:   (value: string) => void;
  onToggleFilters:  () => void;
  onClearFilters:   () => void;
  onNewApplication: () => void;
  totalCount:       number;
}

export function ApplicationToolbar({
  filters,
  activeFilterCount,
  onSearchChange,
  onToggleFilters,
  onClearFilters,
  onNewApplication,
  totalCount,
}: ApplicationToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-4 border-b border-border/50">
      {/* search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search company or role…"
          className="pl-8 h-9 bg-muted/30"
          value={filters.search ?? ""}
          onChange={e => onSearchChange(e.target.value)}
        />
        {filters.search && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* filter toggle */}
      <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onToggleFilters}>
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-0.5 h-5 w-5 p-0 flex items-center justify-center text-[11px]">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={onClearFilters}>
          Clear
        </Button>
      )}

      {/* spacer */}
      <div className="flex-1" />

      {/* count */}
      <span className="text-sm text-muted-foreground hidden sm:block">
        {totalCount} application{totalCount !== 1 ? "s" : ""}
      </span>

      {/* new */}
      <Button size="sm" className="h-9 gap-1.5" onClick={onNewApplication}>
        <Plus className="h-4 w-4" />
        New
      </Button>
    </div>
  );
}
