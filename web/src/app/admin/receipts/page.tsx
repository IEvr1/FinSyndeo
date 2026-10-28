import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, formatMinor, listCommissionEntries } from "@/lib/admin/queries";

export default async function AdminReceiptsPage() {
  const rows = await listCommissionEntries();

  return (
    <AdminFunctionPage
      eyebrow="Provider commissions"
      title="Add provider commissions"
      lead="Record provider-side commission receipts and client allocation."
    >
      <div className="notice">
        Recording commission receipts with bank evidence remains a separate authorised workflow. This view lists posted
        commission entries when present.
      </div>
      <AdminToolbar hint={`${rows.length} commission entries`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No commission entries"
        emptyDescription="Commission rows appear when provider receipts are posted to the ledger."
        columns={[
          { key: "intro", header: "Introducer", render: (r) => r.introducerName ?? "—" },
          { key: "client", header: "Client", render: (r) => r.clientName ?? "—" },
          { key: "gross", header: "Gross", render: (r) => formatMinor(r.grossMinor, r.currency) },
          { key: "share", header: "Share", render: (r) => formatMinor(r.shareMinor, r.currency) },
          { key: "rate", header: "Rate", render: (r) => `${r.ratePercent}%` },
          { key: "posted", header: "Posted", render: (r) => formatDate(r.postedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
