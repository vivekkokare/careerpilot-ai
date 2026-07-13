import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Company" subtitle={id} />
      <Card><CardContent className="pt-6 text-sm text-muted-foreground">Company detail panel.</CardContent></Card>
    </div>
  );
}
