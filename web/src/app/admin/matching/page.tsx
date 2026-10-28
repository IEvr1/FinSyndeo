import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listProviderOfferRevisions, shortId } from "@/lib/admin/queries";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";

export default async function AdminMatchingPage() {
  const rows = await listProviderOfferRevisions();

  return (
    <AdminFunctionPage
      eyebrow="Matching"
      title="Matching criteria"
      lead="Essential eligibility before preference ranking."
    >
      <div className="notice">
        Published profile revisions drive matching. Extracted document rules remain proposals until an authorised admin
        publication step (not available in this read-only view).
      </div>
      <AdminToolbar hint={`${rows.length} provider offer revisions`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No offer revisions"
        emptyDescription="Provider profile revisions appear when institutions save or submit profiles."
        columns={[
          { key: "provider", header: "Provider", render: (r) => r.legalName ?? shortId(r.providerId) },
          { key: "rev", header: "Revision", render: (r) => String(r.revisionNumber) },
          {
            key: "status",
            header: "Approval",
            render: (r) => <AdminStatusPill label={r.approvalStatus} tone="brand" />,
          },
          { key: "published", header: "Published", render: (r) => formatDate(r.publishedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
