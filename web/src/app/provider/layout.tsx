export const instant = false;

import { PlatformShell } from "@/components/PlatformShell";
import { PROVIDER_NAV } from "@/lib/nav/config";
import { requireRoleLayout } from "@/lib/auth/guard";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRoleLayout("provider");
  return (
    <PlatformShell role="provider" persona={user.email} nav={PROVIDER_NAV}>
      {children}
    </PlatformShell>
  );
}
