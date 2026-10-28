import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { formatDate, listCountryPoliciesDb } from "@/lib/admin/queries";
import { getActiveCountryPolicy } from "@/lib/country-policy";

export default async function AdminCountryPolicyPage() {
  const active = getActiveCountryPolicy();
  const dbRows = await listCountryPoliciesDb();

  return (
    <AdminFunctionPage
      eyebrow="Country policy"
      title="Country acceptance"
      lead="Two-group policy. Group 1 excludes platform countries; Group 2 retains full UBO catalogue."
    >
      <div className="notice">
        The Russia/Iran review sample is not loaded as production policy. Publish counsel-approved exclusions before
        release.
      </div>
      <section className="panel">
        <h2 className="text-lg mt-0">Active in-memory policy (runtime)</h2>
        <p className="m-0 mb-2">
          Version {active.version} ·{" "}
          <AdminStatusPill label={active.published ? "Published" : "Draft"} tone={active.published ? "brand" : "warn"} />
        </p>
        <p className="text-sm text-[var(--muted)] m-0">
          Group 1 exclusions: {active.group1Exclusions.length ? active.group1Exclusions.join(", ") : "None configured"}
        </p>
      </section>
      <AdminToolbar hint={`${dbRows.length} stored policy versions (database)`} />
      <AdminDataTable
        rows={dbRows}
        rowKey={(r) => r.id}
        emptyTitle="No published DB policy versions"
        emptyDescription="Database country_policies rows will appear when counsel-approved versions are stored."
        columns={[
          { key: "ver", header: "Version", render: (r) => String(r.version) },
          {
            key: "pub",
            header: "Published",
            render: (r) => <AdminStatusPill label={r.published ? "Yes" : "No"} tone={r.published ? "brand" : "muted"} />,
          },
          { key: "excl", header: "Group 1 exclusions", render: (r) => String((r.group1Exclusions as string[])?.length ?? 0) },
          { key: "from", header: "Effective from", render: (r) => formatDate(r.effectiveFrom) },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
