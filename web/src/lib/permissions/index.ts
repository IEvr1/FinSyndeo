import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export type MembershipRole = "applicant" | "provider" | "introducer" | "admin";

export type AuthContext = {
  user: SessionUser;
  memberships: Array<{
    id: string;
    role: MembershipRole;
    providerId: string | null;
    introducerId: string | null;
  }>;
};

export async function loadAuthContext(user: SessionUser): Promise<AuthContext> {
  const db = getDb();
  const memberships = await db
    .select({
      id: schema.memberships.id,
      role: schema.memberships.role,
      providerId: schema.memberships.providerId,
      introducerId: schema.memberships.introducerId,
    })
    .from(schema.memberships)
    .where(and(eq(schema.memberships.userId, user.id), eq(schema.memberships.active, true)));

  return {
    user,
    memberships: memberships.map((m) => ({
      id: m.id,
      role: m.role as MembershipRole,
      providerId: m.providerId,
      introducerId: m.introducerId,
    })),
  };
}

export function hasRole(ctx: AuthContext, role: MembershipRole): boolean {
  return ctx.memberships.some((m) => m.role === role);
}

export function requireRole(ctx: AuthContext, role: MembershipRole): void {
  if (!hasRole(ctx, role)) {
    throw new PermissionError("Insufficient role for this action.");
  }
}

export async function assertApplicationOwner(
  ctx: AuthContext,
  applicationId: string
): Promise<void> {
  requireRole(ctx, "applicant");
  const db = getDb();
  const [app] = await db
    .select({ ownerUserId: schema.applications.ownerUserId })
    .from(schema.applications)
    .where(eq(schema.applications.id, applicationId))
    .limit(1);
  if (!app || app.ownerUserId !== ctx.user.id) {
    throw new PermissionError("Application not found or access denied.");
  }
}

export async function assertProviderAccess(
  ctx: AuthContext,
  providerId: string
): Promise<void> {
  const membership = ctx.memberships.find(
    (m) => m.role === "provider" && m.providerId === providerId
  );
  if (!membership && !hasRole(ctx, "admin")) {
    throw new PermissionError("Provider access denied.");
  }
}

export async function assertIntroducerAccess(
  ctx: AuthContext,
  introducerId: string
): Promise<void> {
  const membership = ctx.memberships.find(
    (m) => m.role === "introducer" && m.introducerId === introducerId
  );
  if (!membership && !hasRole(ctx, "admin")) {
    throw new PermissionError("Introducer access denied.");
  }
}

export function assertAdmin(ctx: AuthContext): void {
  requireRole(ctx, "admin");
  if (!ctx.user.emailVerified) {
    throw new PermissionError("Admin account requires verified email.");
  }
}

export function canAccessDocument(
  ctx: AuthContext,
  classification: string,
  ownerType: string,
  ownerId: string
): boolean {
  if (hasRole(ctx, "admin")) {
    return true;
  }

  switch (classification) {
    case "internal_original":
    case "internal_extracted":
    case "internal_dd_report":
      return hasRole(ctx, "admin");
    case "institution_profile":
      return hasRole(ctx, "provider") || hasRole(ctx, "applicant");
    case "introducer_safe":
      return hasRole(ctx, "introducer");
    case "signed_evidence":
      return hasRole(ctx, "admin") || hasRole(ctx, "introducer");
    default:
      return false;
  }
}

export class PermissionError extends Error {
  code = "PERMISSION_DENIED";
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}
