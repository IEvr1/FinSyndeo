import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { UnresolvedList } from "@/components/UnresolvedList";

export default function AdminPage() {
  return (
    <AdminFunctionPage eyebrow="Particulars" title="Unresolved particulars" lead="Legal and commercial placeholders blocking dependent actions.">
      <UnresolvedList filter="all" />
    </AdminFunctionPage>
  );
}
