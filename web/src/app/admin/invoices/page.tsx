import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminSupplierPaymentForm } from "@/components/admin/AdminSupplierPaymentForm";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, formatMinor, listCommissionEntries, listPayments } from "@/lib/admin/queries";

export default async function AdminInvoicesPage() {
  const [payments, commissions] = await Promise.all([listPayments(), listCommissionEntries()]);

  return (
    <AdminFunctionPage
      eyebrow="Invoices & payments"
      title="Invoices & payments"
      lead="Introducer invoice review, payment recording and reconciliation."
    >
      <AdminSupplierPaymentForm />
      <div className="notice">
        Applicant introduction payments and introducer commission entries are shown below for reconciliation.
      </div>
      <h2 className="text-xl">Introduction payments</h2>
      <AdminToolbar hint={`${payments.length} payment records`} />
      <AdminDataTable
        rows={payments}
        rowKey={(r) => r.id}
        emptyTitle="No introduction payments"
        emptyDescription="Payments appear when applicants complete paid introduction checkout."
        columns={[
          { key: "gateway", header: "Gateway", render: (r) => r.gateway },
          { key: "order", header: "Order ID", render: (r) => r.gatewayOrderId },
          { key: "amount", header: "Amount", render: (r) => formatMinor(r.amountMinor, r.currency) },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "verified", header: "Verified", render: (r) => formatDate(r.verifiedAt) },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
      <h2 className="text-xl mt-8">Commission payables (related)</h2>
      <AdminDataTable
        rows={commissions}
        rowKey={(r) => r.id}
        emptyTitle="No commission payables"
        emptyDescription="Commission entries support introducer invoice reconciliation."
        columns={[
          { key: "intro", header: "Introducer", render: (r) => r.introducerName ?? "—" },
          { key: "share", header: "Share due", render: (r) => formatMinor(r.shareMinor, r.currency) },
          { key: "posted", header: "Posted", render: (r) => formatDate(r.postedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
