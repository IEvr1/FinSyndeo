import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listCanonicalClients, shortId } from "@/lib/admin/queries";

export default async function AdminClientsPage() {
  const rows = await listCanonicalClients();

  return (
    <AdminFunctionPage
      eyebrow="Clients & relationships"
      title="Clients, applications & relationships"
      lead="Canonical clients, introducer attribution and provider relationship status."
    >
      <AdminToolbar hint={`${rows.length} canonical client records`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No canonical clients yet"
        emptyDescription="Client identity is created when an applicant starts an assessment."
        columns={[
          { key: "name", header: "Display name", render: (r) => r.displayName },
          { key: "type", header: "Identity type", render: (r) => r.identityType },
          { key: "intro", header: "Introducer", render: (r) => (r.introducerId ? shortId(r.introducerId) : "Direct") },
          {
            key: "free",
            header: "Free intros used",
            render: (r) => <AdminStatusPill label={String(r.freeIntroductionsUsed)} tone="muted" />,
          },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
