import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listScreeningRuns, listScreeningSources } from "@/lib/admin/queries";

export default async function AdminScreeningPage() {
  const [sources, runs] = await Promise.all([listScreeningSources(), listScreeningRuns()]);

  return (
    <AdminFunctionPage
      eyebrow="Screening"
      title="Screening health"
      lead="Official list source freshness and failure handling."
    >
      <div className="notice">
        PEP: not enabled until vendor configured. Adverse media: disabled until Article 10 basis established. Source
        refresh uses POST /api/admin/screening/ingest (authorised admin API).
      </div>
      <h2 className="text-xl">Sources</h2>
      <AdminToolbar hint={`${sources.length} configured sources`} />
      <AdminDataTable
        rows={sources}
        rowKey={(r) => r.id}
        emptyTitle="No screening sources"
        emptyDescription="Run screening ingest to register official list sources."
        columns={[
          { key: "key", header: "Source key", render: (r) => r.sourceKey },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "version", header: "Version", render: (r) => r.version ?? "—" },
          { key: "retrieved", header: "Retrieved", render: (r) => formatDate(r.retrievedAt) },
          { key: "maxAge", header: "Max age (h)", render: (r) => String(r.maxAgeHours) },
        ]}
      />
      <h2 className="text-xl mt-8">Recent runs</h2>
      <AdminDataTable
        rows={runs}
        rowKey={(r) => r.id}
        emptyTitle="No screening runs"
        emptyDescription="Screening runs appear during introduction release checks."
        columns={[
          { key: "scope", header: "Scope", render: (r) => r.scope },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "subject", header: "Subject", render: (r) => r.subjectId },
          { key: "expires", header: "Expires", render: (r) => formatDate(r.expiresAt) },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
