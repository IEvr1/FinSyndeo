import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listProviderReportSnapshots } from "@/lib/admin/queries";

export default async function AdminReportControlsPage() {
  const rows = await listProviderReportSnapshots();

  return (
    <AdminFunctionPage
      eyebrow="Report controls"
      title="Provider report controls"
      lead="These reports go from SOPHIMA AI to the selected provider. Incoming commission reports remain separate."
    >
      <AdminToolbar hint={`${rows.length} generated report snapshots`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No provider reports generated"
        emptyDescription="Report snapshots appear when provider reporting jobs complete."
        columns={[
          { key: "provider", header: "Provider", render: (r) => r.legalName ?? "—" },
          { key: "period", header: "Period", render: (r) => r.periodLabel },
          { key: "format", header: "Format", render: (r) => r.format },
          { key: "generated", header: "Generated", render: (r) => formatDate(r.generatedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
