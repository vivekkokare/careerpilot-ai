import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Application } from "@/types/api";
import { useCreateApplication, useUpdateApplication } from "../hooks/useApplicationMutations";

const schema = z.object({
  role:          z.string().min(2, "Role is required"),
  companyName:   z.string().min(1, "Company is required"),
  jdUrl:         z.string().url("Must be a valid URL").optional().or(z.literal("")),
  trackerNotes:  z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ApplicationFormProps {
  open:        boolean;
  onClose:     () => void;
  editTarget?: Application;
}

export function ApplicationForm({ open, onClose, editTarget }: ApplicationFormProps) {
  const isEdit = Boolean(editTarget);
  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication(editTarget?.id ?? "");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editTarget
      ? {
          role:         editTarget.role,
          companyName:  editTarget.company?.name ?? "",
          jdUrl:        "",
          trackerNotes: editTarget.trackerNotes ?? "",
        }
      : { role: "", companyName: "", jdUrl: "", trackerNotes: "" },
  });

  async function onSubmit(data: FormValues) {
    if (isEdit) {
      await updateMutation.mutateAsync({ role: data.role, trackerNotes: data.trackerNotes });
    } else {
      await createMutation.mutateAsync({
        role: data.role,
        companyName: data.companyName,
        jdUrl: data.jdUrl || undefined,
        trackerNotes: data.trackerNotes,
      });
    }
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit application" : "New application"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role">Role *</Label>
            <Input id="role" placeholder="e.g. Staff AI Engineer" {...register("role")} />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company *</Label>
              <Input id="companyName" placeholder="e.g. Anthropic" {...register("companyName")} />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
            </div>
          )}

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="jdUrl">Job posting URL</Label>
              <Input id="jdUrl" placeholder="https://…" type="url" {...register("jdUrl")} />
              {errors.jdUrl && <p className="text-xs text-destructive">{errors.jdUrl.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="trackerNotes">Notes</Label>
            <Textarea
              id="trackerNotes"
              placeholder="Any quick notes…"
              rows={3}
              {...register("trackerNotes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
