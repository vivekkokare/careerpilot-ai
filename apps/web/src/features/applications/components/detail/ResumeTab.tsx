import { FileText, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Stub — wired to real API in M2
const MOCK_RESUME_VERSIONS = [
  { id: "rv1", label: "v1 — tailored (Anthropic)", filePath: "output/742-anthropic-cv.pdf", createdAt: "2026-07-11T17:00:00Z" },
];

export function ResumeTab({ applicationId }: { applicationId: string }) {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Resume versions</h3>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Generate new
        </Button>
      </div>

      {MOCK_RESUME_VERSIONS.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No resume versions yet. Generate one with the <code className="font-mono">pdf</code> mode.
        </div>
      ) : (
        <div className="space-y-2">
          {MOCK_RESUME_VERSIONS.map(v => (
            <div
              key={v.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.label}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(v.createdAt), "MMM d, yyyy 'at' HH:mm")}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label="Download">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
