import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listIntroducers, shortId } from "@/lib/admin/queries";

export default async function AdminIntroducersPage() {
  const rows = await listIntroducers();

  return (
    <AdminFunctionPage eyebrow="Profiles" title="Introducers" lead="Invitation-only introducer management.">
      <AdminToolbar hint={`${rows.length} introducer profiles`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No introducers"
        emptyDescription="Invite introducers from Users & invitations."
        columns={[
          { key: "name", header: "Display name", render: (r) => r.displayName },
          { key: "email", header: "Email", render: (r) => r.email },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "token", header: "Referral token", render: (r) => shortId(r.referralToken) },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
