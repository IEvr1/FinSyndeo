export const instant = false;

import { PlatformShell } from "@/components/PlatformShell";
import { ADMIN_NAV } from "@/lib/nav/config";
import { requireRoleLayout } from "@/lib/auth/guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRoleLayout("admin");
  return (
    <PlatformShell role="admin" persona={user.email} nav={ADMIN_NAV}>
      {children}
    </PlatformShell>
  );
}
