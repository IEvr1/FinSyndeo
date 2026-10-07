import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { UnresolvedList } from "@/components/UnresolvedList";

export default function AdminPage() {
  return (
    <AdminFunctionPage eyebrow="Overview" title="SOPHIMA overview" lead="Prospects, providers, introductions, due diligence and accounting.">
      <UnresolvedList filter="open" />
    </AdminFunctionPage>
  );
}
