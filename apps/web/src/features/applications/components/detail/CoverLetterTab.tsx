import { Copy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_COVER = `Dear Hiring Team,

I'm applying for the Staff AI Engineer role at Anthropic. Having spent the last four years building production LLM inference infrastructure at scale, I'm drawn to Anthropic's mission of ensuring AI systems are safe, interpretable, and reliably beneficial.

My recent work includes...

I'd welcome the opportunity to discuss how my background aligns with your platform team's goals.

Best regards`;

export function CoverLetterTab({ applicationId }: { applicationId: string }) {
  async function copyToClipboard() {
    await navigator.clipboard.writeText(MOCK_COVER);
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cover letter</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={copyToClipboard}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Wand2 className="h-3.5 w-3.5" /> Regenerate
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/10 p-5">
        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">
          {MOCK_COVER}
        </pre>
      </div>

      <p className="text-xs text-muted-foreground">
        Generated from <code className="font-mono">apply</code> mode. Edit in the career-ops CLI to regenerate.
      </p>
    </div>
  );
}
