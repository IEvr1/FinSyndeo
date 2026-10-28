import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listDocumentsInternal, shortId } from "@/lib/admin/queries";

export default async function AdminDiligencePage() {
  const rows = await listDocumentsInternal();

  return (
    <AdminFunctionPage
      eyebrow="Due diligence"
      title="Due diligence & client file"
      lead="Internal SOPHIMA review. Confidential reports stay separate from institution profiles."
    >
      <AdminToolbar hint={`${rows.length} stored documents (internal classifications)`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No diligence documents"
        emptyDescription="Uploaded and generated documents appear here with their classification."
        columns={[
          { key: "file", header: "File", render: (r) => r.fileName },
          {
            key: "class",
            header: "Classification",
            render: (r) => <AdminStatusPill label={r.classification} tone="brand" />,
          },
          { key: "owner", header: "Owner", render: (r) => `${r.ownerType} · ${shortId(r.ownerId)}` },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
