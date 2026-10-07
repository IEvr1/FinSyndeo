export const instant = false;

import { PlatformShell } from "@/components/PlatformShell";
import { INTRODUCER_NAV } from "@/lib/nav/config";
import { requireRoleLayout } from "@/lib/auth/guard";

export default async function IntroducerLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRoleLayout("introducer");
  return (
    <PlatformShell role="introducer" persona={user.email} nav={INTRODUCER_NAV}>
      {children}
    </PlatformShell>
  );
}
