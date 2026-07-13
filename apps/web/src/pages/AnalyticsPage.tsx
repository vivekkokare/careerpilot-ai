import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Pipeline patterns, score distribution, funnel velocity" />
      <EmptyState
        icon={BarChart3}
        title="No data yet"
        description="Analytics charts render once you have at least 5 evaluated applications."
      />
    </div>
  );
}
