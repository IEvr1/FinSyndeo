import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listAgreements, listProviders } from "@/lib/admin/queries";

export default async function AdminProviderTermsPage() {
  const [providers, agreements] = await Promise.all([listProviders(), listAgreements()]);

  return (
    <AdminFunctionPage
      eyebrow="Commercial terms"
      title="Provider commercial terms"
      lead="Negotiated terms — no fixed pricing tab."
    >
      <div className="notice">
        Commercial terms are negotiated per relationship. Recording payment evidence and publication remains a separate
        authorised workflow.
      </div>
      <AdminToolbar hint={`${providers.length} providers · ${agreements.length} introducer agreements on file`} />
      <AdminDataTable
        rows={providers}
        rowKey={(r) => r.id}
        emptyTitle="No providers"
        emptyDescription="Provider commercial posture is tracked alongside institution profiles."
        columns={[
          { key: "name", header: "Institution", render: (r) => r.legalName },
          { key: "agreement", header: "Referral agreement", render: (r) => (
            <AdminStatusPill label={r.agreementSigned ? "Signed" : "Outstanding"} tone={r.agreementSigned ? "brand" : "warn"} />
          ) },
          { key: "approved", header: "Approved", render: (r) => (
            <AdminStatusPill label={r.approved ? "Yes" : "Review"} tone={r.approved ? "brand" : "muted"} />
          ) },
          { key: "created", header: "Registered", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
