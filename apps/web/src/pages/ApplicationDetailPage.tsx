import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplication } from "@/features/applications/hooks/useApplication";
import { ApplicationDetail } from "@/features/applications/components/detail/ApplicationDetail";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useApplication(id ?? "");

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted-foreground">Application not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/applications")}>
          Back to applications
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground -ml-2"
          onClick={() => navigate("/applications")}
        >
          <ArrowLeft className="h-4 w-4" />
          Applications
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {data ? (
          <ApplicationDetail data={data} isLoading={isLoading} />
        ) : isLoading ? (
          <ApplicationDetail data={null as any} isLoading={true} />
        ) : null}
      </div>
    </div>
  );
}
