import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listPrivacyRequests, shortId } from "@/lib/admin/queries";

export default async function AdminPrivacyPage() {
  const rows = await listPrivacyRequests();

  return (
    <AdminFunctionPage
      eyebrow="Privacy"
      title="Privacy requests"
      lead="Rights handling and erasure propagation."
    >
      <AdminToolbar hint={`${rows.length} data subject requests`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No privacy requests"
        emptyDescription="Applicant and provider privacy requests appear when submitted."
        columns={[
          { key: "type", header: "Type", render: (r) => r.requestType },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "user", header: "User", render: (r) => shortId(r.userId) },
          { key: "provider", header: "Provider", render: (r) => (r.providerId ? shortId(r.providerId) : "—") },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
          { key: "resolved", header: "Resolved", render: (r) => formatDate(r.resolvedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
