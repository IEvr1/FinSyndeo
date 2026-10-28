import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listAuditEvents, shortId } from "@/lib/admin/queries";

export default async function AdminIntroAuditPage() {
  const rows = await listAuditEvents();
  const commissionRows = rows.filter(
    (r) =>
      r.resourceType.includes("commission") ||
      r.resourceType.includes("introducer") ||
      r.action.includes("commission") ||
      r.action.includes("invoice")
  );

  return (
    <AdminFunctionPage
      eyebrow="Introducer audit trail"
      title="Introducer audit trail"
      lead="Commission, invoice and agreement events with before and after values."
    >
      <AdminToolbar hint={`${commissionRows.length} introducer/commercial events`} />
      <AdminDataTable
        rows={commissionRows.length ? commissionRows : rows}
        rowKey={(r) => r.id}
        emptyTitle="No introducer audit events"
        emptyDescription="Commercial and introducer audit entries appear when accounting actions are recorded."
        columns={[
          { key: "action", header: "Action", render: (r) => r.action },
          { key: "resource", header: "Resource", render: (r) => `${r.resourceType}${r.resourceId ? ` · ${shortId(r.resourceId)}` : ""}` },
          { key: "meta", header: "Metadata", render: (r) => (r.metadata ? JSON.stringify(r.metadata).slice(0, 60) : "—") },
          { key: "when", header: "When", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
