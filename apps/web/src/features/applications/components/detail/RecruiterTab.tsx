import { Mail, Linkedin, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Stub — recruiter contacts come from Company contacts endpoint in M2
const MOCK_CONTACTS = [
  { id: "rc1", name: "Sarah Chen", title: "Talent Partner", email: "sarah@anthropic.com", linkedinUrl: "https://linkedin.com/in/sarahchen", type: "RECRUITER" },
];

export function RecruiterTab({ applicationId }: { applicationId: string }) {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Contacts</h3>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Add contact
        </Button>
      </div>

      {MOCK_CONTACTS.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No contacts yet. Add a recruiter or hiring manager.
        </p>
      ) : (
        <div className="space-y-2">
          {MOCK_CONTACTS.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/10">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center font-semibold text-primary text-sm shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.title}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {c.email && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                    <a href={`mailto:${c.email}`} aria-label="Email"><Mail className="h-4 w-4" /></a>
                  </Button>
                )}
                {c.linkedinUrl && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                    <a href={c.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
