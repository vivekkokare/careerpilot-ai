import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

export default function RemindersPage() {
  return (
    <div>
      <PageHeader
        title="Reminders"
        subtitle="Follow-up cadence and deadlines"
        action={<Button size="sm">Add reminder</Button>}
      />
      <EmptyState
        icon={Bell}
        title="No reminders"
        description="Reminders are auto-created when you apply to a role. You can also add them manually."
        action={<Button variant="outline" size="sm">Add reminder</Button>}
      />
    </div>
  );
}
