import { Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function EvaluationsPage() {
  return (
    <div>
      <PageHeader title="Evaluations" subtitle="AI evaluation history" />
      <EmptyState
        icon={Zap}
        title="No evaluations yet"
        description="Evaluation history appears here after your first JD analysis."
      />
    </div>
  );
}
