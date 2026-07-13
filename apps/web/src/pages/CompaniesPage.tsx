import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CompaniesPage() {
  return (
    <div>
      <PageHeader title="Companies" subtitle="All companies in your pipeline" />
      <EmptyState
        icon={Building2}
        title="No companies yet"
        description="Companies appear here once you evaluate your first job description."
      />
    </div>
  );
}
