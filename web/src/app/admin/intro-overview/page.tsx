import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminMetricTiles } from "@/components/admin/AdminMetricTiles";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AUTOMATIC_TIERS } from "@/lib/accounting";
import { formatDate, listCommissionEntries, listIntroducers } from "@/lib/admin/queries";

export default async function AdminIntroOverviewPage() {
  const [rows, commissions] = await Promise.all([listIntroducers(), listCommissionEntries()]);
  const active = rows.filter((r) => r.status === "active").length;

  return (
    <AdminFunctionPage
      eyebrow="Introducers"
      title="Introducer overview & tiers"
      lead="Automatic tiers 30/40/50 percent."
    >
      <AdminMetricTiles
        metrics={[
          { label: "Introducers", value: rows.length, href: "/admin/introducers" },
          { label: "Active", value: active },
          { label: "Tier 3 rate", value: `${AUTOMATIC_TIERS[2].ratePercent}%` },
          { label: "Commission entries", value: commissions.length, href: "/admin/receipts" },
        ]}
      />
      <AdminToolbar hint="Recent introducer accounts" />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No introducers"
        emptyDescription="Introducers are created through admin invitation."
        columns={[
          { key: "name", header: "Name", render: (r) => r.displayName },
          { key: "email", header: "Email", render: (r) => r.email },
          { key: "status", header: "Status", render: (r) => <AdminStatusPill label={r.status} tone="brand" /> },
          { key: "tier", header: "Tier achieved", render: (r) => String(r.tierAchieved) },
          { key: "rate", header: "Bespoke %", render: (r) => (r.bespokeRate != null ? String(r.bespokeRate) : "—") },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
