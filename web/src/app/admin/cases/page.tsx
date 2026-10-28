import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listApplications, shortId } from "@/lib/admin/queries";
import { formatAssessmentRoute } from "@/lib/questionnaire/private-banking-config";

export default async function AdminCasesPage() {
  const rows = await listApplications();

  return (
    <AdminFunctionPage
      eyebrow="Prospects & assessments"
      title="Prospects & assessments"
      lead="Review submitted applications and assessment status."
    >
      <AdminToolbar hint={`Showing ${rows.length} most recent assessments`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No assessments yet"
        emptyDescription="Applications appear here when applicants save or confirm assessments."
        columns={[
          { key: "id", header: "Case", render: (r) => shortId(r.id) },
          { key: "client", header: "Client", render: (r) => r.displayName ?? shortId(r.clientId) },
          { key: "route", header: "Route", render: (r) => formatAssessmentRoute(r.route) },
          {
            key: "status",
            header: "Status",
            render: (r) => <AdminStatusPill label={r.status} tone="brand" />,
          },
          { key: "updated", header: "Updated", render: (r) => formatDate(r.updatedAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
