import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listPlatformSettings } from "@/lib/admin/queries";

export default async function AdminSettingsPage() {
  const rows = await listPlatformSettings();

  return (
    <AdminFunctionPage eyebrow="Settings" title="Platform settings" lead="Production configuration.">
      <div className="notice">Settings changes affect live behaviour. Authorised review is required before production edits.</div>
      <AdminToolbar hint={`${rows.length} keys`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No settings stored"
        emptyDescription="Platform configuration is stored in platform_settings."
        columns={[
          { key: "key", header: "Key", render: (r) => r.key },
          { key: "value", header: "Value", render: (r) => (
            <code className="text-xs">{JSON.stringify(r.value)}</code>
          ) },
          { key: "updated", header: "Updated", render: (r) => formatDate(r.updatedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
