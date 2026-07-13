import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function InterviewsPage() {
  return (
    <div>
      <PageHeader title="Interviews" subtitle="Scheduled and completed interview rounds" />
      <EmptyState
        icon={CalendarDays}
        title="No interviews yet"
        description="Interview rounds appear here when an application reaches Interview status."
      />
    </div>
  );
}
