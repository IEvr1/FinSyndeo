import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listPlatformSettings } from "@/lib/admin/queries";

export default async function AdminIntroductionSettingsPage() {
  const rows = await listPlatformSettings();
  const intro = rows.find((r) => r.key === "introduction_pricing");

  return (
    <AdminFunctionPage
      eyebrow="Pricing"
      title="Introduction & pricing"
      lead="Free allowance and paid introduction settings."
    >
      {intro ? (
        <section className="panel">
          <h2 className="text-lg mt-0">introduction_pricing</h2>
          <pre className="text-sm overflow-auto m-0">{JSON.stringify(intro.value, null, 2)}</pre>
          <p className="text-sm text-[var(--muted)] mb-0 mt-3">Updated {formatDate(intro.updatedAt)}</p>
        </section>
      ) : (
        <div className="notice">No introduction_pricing row in platform_settings yet.</div>
      )}
      <AdminToolbar hint="All platform settings keys" />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No platform settings"
        emptyDescription="Settings are stored as key/value rows in platform_settings."
        columns={[
          { key: "key", header: "Key", render: (r) => r.key },
          { key: "value", header: "Value preview", render: (r) => JSON.stringify(r.value).slice(0, 80) },
          { key: "updated", header: "Updated", render: (r) => formatDate(r.updatedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
