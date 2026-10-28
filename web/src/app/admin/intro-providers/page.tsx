import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listAgreements, listProviders } from "@/lib/admin/queries";

export default async function AdminIntroProvidersPage() {
  const [providers, agreements] = await Promise.all([listProviders(), listAgreements()]);

  return (
    <AdminFunctionPage
      eyebrow="Access"
      title="Introducer provider access"
      lead="Provider participation and commission reporting eligibility."
    >
      <AdminToolbar hint={`${providers.length} providers · ${agreements.length} agreements`} />
      <AdminDataTable
        rows={providers}
        rowKey={(r) => r.id}
        emptyTitle="No providers"
        emptyDescription="Provider participation flags appear as institutions register."
        columns={[
          { key: "name", header: "Provider", render: (r) => r.legalName },
          {
            key: "active",
            header: "Matching active",
            render: (r) => <AdminStatusPill label={r.active ? "Yes" : "No"} tone={r.active ? "brand" : "muted"} />,
          },
          {
            key: "approved",
            header: "Approved",
            render: (r) => <AdminStatusPill label={r.approved ? "Yes" : "Pending"} tone={r.approved ? "brand" : "warn"} />,
          },
          { key: "created", header: "Registered", render: (r) => formatDate(r.createdAt) },
        ]}
      />
      {agreements.length > 0 ? (
        <>
          <h2 className="text-xl mt-8">Introducer agreements</h2>
          <AdminDataTable
            rows={agreements}
            rowKey={(r) => r.id}
            columns={[
              { key: "intro", header: "Introducer", render: (r) => r.displayName ?? "—" },
              { key: "type", header: "Type", render: (r) => r.agreementType },
              { key: "ver", header: "Version", render: (r) => r.version },
              { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
              { key: "accepted", header: "Accepted", render: (r) => formatDate(r.acceptedAt) },
            ]}
          />
        </>
      ) : null}
    </AdminFunctionPage>
  );
}
