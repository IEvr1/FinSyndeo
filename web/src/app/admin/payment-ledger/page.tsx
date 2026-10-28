import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, formatMinor, listPayments, shortId } from "@/lib/admin/queries";

export default async function AdminPaymentLedgerPage() {
  const rows = await listPayments();

  return (
    <AdminFunctionPage
      eyebrow="Applicant payment ledger"
      title="Applicant payment ledger"
      lead="Separate from provider commission receipts and introducer payables."
    >
      <AdminToolbar hint={`${rows.length} applicant-side payments`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No applicant payments"
        emptyDescription="Introduction checkout payments are listed here when verified."
        columns={[
          { key: "id", header: "Payment", render: (r) => shortId(r.id) },
          { key: "intro", header: "Introduction", render: (r) => shortId(r.introductionRequestId) },
          { key: "amount", header: "Amount", render: (r) => formatMinor(r.amountMinor, r.currency) },
          { key: "gateway", header: "Gateway", render: (r) => r.gateway },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "verified", header: "Verified", render: (r) => formatDate(r.verifiedAt) },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
