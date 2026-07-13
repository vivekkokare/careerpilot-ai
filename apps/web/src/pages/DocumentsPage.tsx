import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader title="Documents" subtitle="Generated CVs, cover letters, and email drafts" />
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="CVs and cover letters appear here after generation."
      />
    </div>
  );
}
