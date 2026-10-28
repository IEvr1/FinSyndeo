import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { formatDate, listUsersWithMemberships, shortId } from "@/lib/admin/queries";

export default async function AdminUsersPage() {
  const rows = await listUsersWithMemberships();

  return (
    <AdminFunctionPage
      eyebrow="Users"
      title="Users & invitations"
      lead="Invitation-only introducer and admin access."
    >
      <InviteUserForm />
      <AdminToolbar hint={`${rows.length} user accounts`} />
      <AdminDataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No users yet"
        emptyDescription="User accounts are created through sign-up or admin invitation."
        columns={[
          { key: "email", header: "Email", render: (r) => r.email },
          { key: "name", header: "Name", render: (r) => r.name ?? "—" },
          {
            key: "verified",
            header: "Verified",
            render: (r) => (
              <AdminStatusPill label={r.emailVerified ? "Verified" : "Unverified"} tone={r.emailVerified ? "brand" : "warn"} />
            ),
          },
          {
            key: "roles",
            header: "Roles",
            render: (r) =>
              r.roles.length ? (
                <span className="flex flex-wrap gap-1">
                  {r.roles.map((role) => (
                    <AdminStatusPill key={role} label={role} tone="brand" />
                  ))}
                </span>
              ) : (
                "—"
              ),
          },
          { key: "id", header: "ID", render: (r) => shortId(r.id) },
          { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </AdminFunctionPage>
  );
}
