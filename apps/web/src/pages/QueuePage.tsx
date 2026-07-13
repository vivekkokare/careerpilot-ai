import { Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function QueuePage() {
  return (
    <div>
      <PageHeader title="Queue" subtitle="BullMQ job status — evaluations, PDFs, scans" />
      <EmptyState
        icon={Layers}
        title="Queue is empty"
        description="Background jobs appear here when evaluations or scans are running."
      />
    </div>
  );
}
