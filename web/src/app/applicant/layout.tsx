export const instant = false;

import { PlatformShell } from "@/components/PlatformShell";
import { APPLICANT_NAV } from "@/lib/nav/config";
import { requireRoleLayout } from "@/lib/auth/guard";

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRoleLayout("applicant");
  return (
    <PlatformShell role="applicant" persona={user.email} nav={APPLICANT_NAV}>
      {children}
    </PlatformShell>
  );
}
