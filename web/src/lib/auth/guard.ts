import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, hasRole, type MembershipRole } from "@/lib/permissions";

export async function requireRoleLayout(role: MembershipRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  const ctx = await loadAuthContext(user);
  if (!hasRole(ctx, role)) redirect("/");
  return { user, ctx };
}
