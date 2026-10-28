import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listAuditEvents, shortId } from "@/lib/admin/queries";

export default async function AdminAuditPage() {
  const rows = await listAuditEvents();
  const introRows = rows.filter(
    (r) => r.resourceType.includes("introduction") || r.action.includes("introduction")
  );

  return (
    <AdminFunctionPage
      eyebrow="Introduction audit trail"
      title="Introduction audit trail"
      lead="Commercial overrides and material introduction state changes retain previous values."
    >
      <AdminToolbar hint={`${introRows.length} introduction-related events (of ${rows.length} total)`} />
      <AdminDataTable
        rows={introRows.length ? introRows : rows}
        rowKey={(r) => r.id}
        emptyTitle="No audit events"
        emptyDescription="Material state changes are appended to the audit log."
        columns={[
          { key: "action", header: "Action", render: (r) => r.action },
          { key: "resource", header: "Resource", render: (r) => `${r.resourceType}${r.resourceId ? ` · ${shortId(r.resourceId)}` : ""}` },
          { key: "reason", header: "Reason", render: (r) => r.reason ?? "—" },
          { key: "actor", header: "Actor", render: (r) => (r.actorUserId ? shortId(r.actorUserId) : "System") },
          { key: "when", header: "When", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
