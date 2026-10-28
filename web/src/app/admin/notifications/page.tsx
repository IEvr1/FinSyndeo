import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listOutboxEvents, shortId } from "@/lib/admin/queries";

export default async function AdminNotificationsPage() {
  const rows = await listOutboxEvents();

  return (
    <AdminFunctionPage
      eyebrow="Notification history"
      title="Notification history"
      lead="Generate candidates and recheck consent, eligibility and screening before delivery."
    >
      <AdminToolbar hint={`${rows.length} outbox events`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No notification history"
        emptyDescription="Email outbox events appear when the platform enqueues delivery."
        columns={[
          { key: "template", header: "Template", render: (r) => r.templateId },
          { key: "event", header: "Business event", render: (r) => r.businessEvent },
          { key: "state", header: "State", render: (r) => <AdminStatusPill label={r.state} tone="brand" /> },
          { key: "attempts", header: "Attempts", render: (r) => String(r.attempts) },
          { key: "sent", header: "Sent", render: (r) => formatDate(r.sentAt) },
          { key: "id", header: "ID", render: (r) => shortId(r.id) },
        ]}
      />
    </AdminFunctionPage>
  );
}
