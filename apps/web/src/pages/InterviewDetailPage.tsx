import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Interview" subtitle={id} />
      <Card><CardContent className="pt-6 text-sm text-muted-foreground">Interview rounds, prep notes, debrief.</CardContent></Card>
    </div>
  );
}
