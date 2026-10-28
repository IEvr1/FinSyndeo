import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { UnresolvedList } from "@/components/UnresolvedList";
import { UNRESOLVED_PARTICULARS } from "@/lib/unresolved";

export default function AdminUnresolvedPage() {
  const open = UNRESOLVED_PARTICULARS.filter((p) => !p.resolved).length;

  return (
    <AdminFunctionPage
      eyebrow="Particulars"
      title="Unresolved particulars"
      lead="Legal and commercial placeholders blocking dependent actions."
    >
      <AdminToolbar hint={`${open} open · ${UNRESOLVED_PARTICULARS.length} total (catalogue)`} />
      <UnresolvedList filter="all" />
    </AdminFunctionPage>
  );
}
