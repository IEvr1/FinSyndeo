import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, formatMinor, listCommissionEntries } from "@/lib/admin/queries";

export default async function AdminAccountingReportsPage() {
  const rows = await listCommissionEntries();
  const totals = rows.reduce(
    (acc, r) => {
      const key = r.currency;
      if (!acc[key]) acc[key] = { gross: 0, share: 0 };
      acc[key].gross += r.grossMinor;
      acc[key].share += r.shareMinor;
      return acc;
    },
    {} as Record<string, { gross: number; share: number }>
  );

  return (
    <AdminFunctionPage
      eyebrow="Accounting reports"
      title="Accounting reports"
      lead="Introducer commission streams, reversals and reconciliation exports."
    >
      <section className="panel">
        <h2 className="text-lg mt-0">Totals (posted entries)</h2>
        {Object.keys(totals).length === 0 ? (
          <p className="text-[var(--muted)] m-0">No commission data to summarise yet.</p>
        ) : (
          <ul className="m-0 pl-5">
            {Object.entries(totals).map(([currency, t]) => (
              <li key={currency}>
                {currency}: gross {formatMinor(t.gross, currency)} · introducer share{" "}
                {formatMinor(t.share, currency)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <AdminToolbar hint={`${rows.length} ledger rows`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No accounting rows"
        emptyDescription="Export-ready commission streams appear when receipts are posted."
        columns={[
          { key: "intro", header: "Introducer", render: (r) => r.introducerName ?? "—" },
          { key: "client", header: "Client", render: (r) => r.clientName ?? "—" },
          { key: "net", header: "Net", render: (r) => formatMinor(r.grossMinor, r.currency) },
          { key: "share", header: "Share", render: (r) => formatMinor(r.shareMinor, r.currency) },
          { key: "posted", header: "Posted", render: (r) => formatDate(r.postedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
