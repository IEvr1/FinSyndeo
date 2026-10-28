import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listIntroductionRequests, listSharingApprovals, shortId } from "@/lib/admin/queries";

export default async function AdminEntitlementsPage() {
  const [requests, approvals] = await Promise.all([listIntroductionRequests(), listSharingApprovals()]);

  return (
    <AdminFunctionPage
      eyebrow="Entitlements"
      title="Entitlements & decisions"
      lead="Exceptional allowances and overrides."
    >
      <div className="notice">
        Exceptional overrides require authorised basis and audit. This view is read-only operational status.
      </div>
      <h2 className="text-xl">Introduction requests</h2>
      <AdminToolbar hint={`${requests.length} requests`} />
      <AdminDataTable
        rows={requests}
        rowKey={(r) => r.id}
        emptyTitle="No introduction requests"
        emptyDescription="Requests appear when applicants authorise sharing and request introductions."
        columns={[
          { key: "id", header: "Request", render: (r) => shortId(r.id) },
          { key: "provider", header: "Provider", render: (r) => r.legalName ?? "—" },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "entitlement", header: "Entitlement", render: (r) => r.entitlementType },
          { key: "payment", header: "Payment", render: (r) => r.paymentStatus },
          { key: "released", header: "Released", render: (r) => formatDate(r.releasedAt) },
        ]}
      />
      <h2 className="text-xl mt-8">Sharing approvals</h2>
      <AdminDataTable
        rows={approvals}
        rowKey={(r) => r.id}
        emptyTitle="No sharing approvals"
        emptyDescription="Applicant sharing authorisations appear here."
        columns={[
          { key: "institution", header: "Institution", render: (r) => r.institutionLegalName },
          { key: "recipient", header: "Recipient", render: (r) => r.recipientEmail },
          { key: "purpose", header: "Purpose", render: (r) => r.purpose },
          { key: "approved", header: "Approved", render: (r) => formatDate(r.approvedAt) },
          { key: "withdrawn", header: "Withdrawn", render: (r) => formatDate(r.withdrawnAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
