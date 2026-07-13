import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { ApplicationFilters, ApplicationStatus, RoleArchetype } from "@/types/api";

const STATUSES: ApplicationStatus[] = [
  "EVALUATED", "APPLIED", "RESPONDED", "INTERVIEW", "OFFER", "REJECTED", "DISCARDED", "SKIP",
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  EVALUATED:  "Evaluated",
  APPLIED:    "Applied",
  RESPONDED:  "Responded",
  INTERVIEW:  "Interview",
  OFFER:      "Offer",
  REJECTED:   "Rejected",
  DISCARDED:  "Discarded",
  SKIP:       "Skip",
  HIRED:      "Hired",
};

const ARCHETYPES: RoleArchetype[] = [
  "AI_PLATFORM_LLMOPS",
  "AGENTIC_AUTOMATION",
  "AI_SOLUTIONS_ARCHITECT",
  "TECHNICAL_AI_PM",
  "DATA_AND_ANALYTICS",
];

const ARCHETYPE_LABELS: Record<RoleArchetype, string> = {
  AI_PLATFORM_LLMOPS:     "AI Platform / LLMOps",
  AGENTIC_AUTOMATION:     "Agentic Automation",
  AI_SOLUTIONS_ARCHITECT: "AI Solutions Architect",
  TECHNICAL_AI_PM:        "Technical AI PM",
  DATA_AND_ANALYTICS:     "Data & Analytics",
};

interface ApplicationFiltersProps {
  open:     boolean;
  onClose:  () => void;
  filters:  ApplicationFilters;
  onChange: (filters: ApplicationFilters) => void;
  onClear:  () => void;
}

function toggleItem<T>(arr: T[] | undefined, item: T): T[] {
  const list = arr ?? [];
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item];
}

export function ApplicationFilters({ open, onClose, filters, onChange, onClear }: ApplicationFiltersProps) {
  function setStatus(s: ApplicationStatus) {
    onChange({ ...filters, status: toggleItem(filters.status, s) });
  }

  function setArchetype(a: RoleArchetype) {
    onChange({ ...filters, archetype: toggleItem(filters.archetype, a) });
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-80 sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Status */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Status
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => {
                const active = filters.status?.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={[
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    ].join(" ")}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Archetype */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Archetype
            </Label>
            <div className="flex flex-col gap-1">
              {ARCHETYPES.map(a => {
                const active = filters.archetype?.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => setArchetype(a)}
                    className={[
                      "text-left px-3 py-1.5 rounded-md text-sm border transition-colors",
                      active
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    {ARCHETYPE_LABELS[a]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score range */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
              Score range
              <span className="ml-2 font-normal normal-case">
                {filters.scoreMin ?? 0} – {filters.scoreMax ?? 5}
              </span>
            </Label>
            <Slider
              min={0} max={5} step={0.5}
              value={[filters.scoreMin ?? 0, filters.scoreMax ?? 5]}
              onValueChange={([min, max]) => onChange({ ...filters, scoreMin: min, scoreMax: max })}
              className="mt-1"
            />
          </div>
        </div>

        <SheetFooter className="flex gap-2 pt-4 border-t border-border/50">
          <Button variant="ghost" className="flex-1" onClick={onClear}>
            Clear all
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
