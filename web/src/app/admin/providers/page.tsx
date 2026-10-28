import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listProviders, shortId } from "@/lib/admin/queries";

function boolPill(value: boolean, yes: string, no: string) {
  return <AdminStatusPill label={value ? yes : no} tone={value ? "brand" : "muted"} />;
}

export default async function AdminProvidersPage() {
  const rows = await listProviders();

  return (
    <AdminFunctionPage
      eyebrow="Providers"
      title="Providers & approvals"
      lead="Verify referral agreements and provider criteria before publication."
    >
      <div className="notice">
        Publication and agreement evidence workflows remain maker/checker gated. This view is read-only operational
        status.
      </div>
      <AdminToolbar hint={`${rows.length} provider institutions`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No providers registered"
        emptyDescription="Financial institutions appear here after provider sign-up."
        columns={[
          { key: "code", header: "Code", render: (r) => r.code },
          { key: "name", header: "Legal name", render: (r) => r.legalName },
          { key: "country", header: "Country", render: (r) => r.country },
          { key: "approved", header: "Approved", render: (r) => boolPill(r.approved, "Yes", "Pending") },
          { key: "agreement", header: "Agreement", render: (r) => boolPill(r.agreementSigned, "Signed", "Missing") },
          { key: "active", header: "Active", render: (r) => boolPill(r.active, "Active", "Inactive") },
          { key: "id", header: "ID", render: (r) => shortId(r.id) },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
