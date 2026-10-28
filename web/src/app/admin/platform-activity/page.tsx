import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listOutboxEvents, listPrivacyRequests, shortId } from "@/lib/admin/queries";

export default async function AdminPlatformActivityPage() {
  const [outbox, privacy] = await Promise.all([listOutboxEvents(), listPrivacyRequests()]);

  return (
    <AdminFunctionPage
      eyebrow="Platform activity"
      title="Platform activity"
      lead="Email outbox, privacy requests and cross-role operational events."
    >
      <h2 className="text-xl">Email outbox</h2>
      <AdminToolbar hint={`${outbox.length} events`} />
      <AdminDataTable
        rows={outbox}
        rowKey={(r) => r.id}
        emptyTitle="No outbox activity"
        emptyDescription="Cross-role email activity is tracked in the outbox."
        columns={[
          { key: "event", header: "Event", render: (r) => r.businessEvent },
          { key: "state", header: "State", render: (r) => <AdminStatusPill label={r.state} tone="brand" /> },
          { key: "template", header: "Template", render: (r) => r.templateId },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
          { key: "id", header: "ID", render: (r) => shortId(r.id) },
        ]}
      />
      <h2 className="text-xl mt-8">Privacy requests</h2>
      <AdminDataTable
        rows={privacy}
        rowKey={(r) => r.id}
        emptyTitle="No privacy activity"
        emptyDescription="Privacy workflow events appear when users exercise rights."
        columns={[
          { key: "type", header: "Type", render: (r) => r.requestType },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
