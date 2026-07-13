import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAddNote, useDeleteNote } from "../../hooks/useApplicationMutations";
import type { ApplicationDetail } from "../../hooks/useApplication";

function NoteCard({
  note,
  onDelete,
}: {
  note: { id: string; content: string; createdAt: string };
  onDelete: (id: string) => void;
}) {
  const [preview, setPreview] = useState(true);

  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
        <span className="text-xs text-muted-foreground">
          {format(new Date(note.createdAt), "MMM d, yyyy 'at' HH:mm")}
        </span>
        <div className="flex gap-1">
          <Button
            size="icon" variant="ghost" className="h-6 w-6"
            onClick={() => setPreview(!preview)}
            aria-label={preview ? "Edit" : "Preview"}
          >
            {preview ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            size="icon" variant="ghost" className="h-6 w-6 text-destructive/70 hover:text-destructive"
            onClick={() => onDelete(note.id)}
            aria-label="Delete note"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {preview ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap font-mono text-foreground leading-relaxed">
            {note.content}
          </p>
        )}
      </div>
    </div>
  );
}

export function NotesTab({ data }: { data: ApplicationDetail }) {
  const { application, notes } = data;
  const [draft, setDraft]  = useState("");
  const [writing, setWriting] = useState(false);
  const addNote    = useAddNote(application.id);
  const deleteNote = useDeleteNote(application.id);

  async function handleSave() {
    if (!draft.trim()) return;
    await addNote.mutateAsync(draft.trim());
    setDraft("");
    setWriting(false);
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notes</h3>
        {!writing && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setWriting(true)}>
            <Plus className="h-3.5 w-3.5" /> New note
          </Button>
        )}
      </div>

      {writing && (
        <div className="space-y-2">
          <Textarea
            autoFocus
            rows={6}
            placeholder="Markdown supported…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="font-mono text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setDraft(""); setWriting(false); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!draft.trim() || addNote.isPending}>
              {addNote.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !writing ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No notes yet. Click "New note" to add one.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={id => deleteNote.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
