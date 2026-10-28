import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  AGREEMENT_TYPE_MASTER,
  AGREEMENT_TYPE_SCHEDULE,
  type ReferralContext,
} from "@/lib/referrals/constants";
import { writeAudit } from "@/lib/services/audit";

export class ReferralError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function resolveReferralToken(token: string) {
  const db = getDb();
  const [introducer] = await db
    .select()
    .from(schema.introducers)
    .where(eq(schema.introducers.referralToken, token))
    .limit(1);
  return introducer ?? null;
}

export async function hasAcceptedAgreement(introducerId: string, agreementType: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.agreements)
    .where(
      and(
        eq(schema.agreements.introducerId, introducerId),
        eq(schema.agreements.agreementType, agreementType),
        eq(schema.agreements.status, "accepted")
      )
    )
    .limit(1);
  return !!row;
}

export async function isLinkActive(introducerId: string): Promise<boolean> {
  const db = getDb();
  const [introducer] = await db
    .select()
    .from(schema.introducers)
    .where(eq(schema.introducers.id, introducerId))
    .limit(1);
  if (!introducer) return false;
  if (introducer.status !== "active") return false;
  if (introducer.linkSuspended) return false;
  const master = await hasAcceptedAgreement(introducerId, AGREEMENT_TYPE_MASTER);
  const schedule = await hasAcceptedAgreement(introducerId, AGREEMENT_TYPE_SCHEDULE);
  return master && schedule;
}

export async function isLinkActiveForToken(token: string) {
  const introducer = await resolveReferralToken(token);
  if (!introducer) return { active: false as const, introducer: null };
  const active = await isLinkActive(introducer.id);
  return { active, introducer };
}

export function buildReferralContext(params: {
  introducerId: string;
  tokenUsed: string;
  onBehalf: boolean;
  submittedByUserId: string;
  authorityConfirmed?: boolean;
  applicantConfirmedAt?: string | null;
}): ReferralContext {
  return {
    introducerId: params.introducerId,
    tokenUsed: params.tokenUsed,
    onBehalf: params.onBehalf,
    authorityConfirmed: params.authorityConfirmed,
    submittedByUserId: params.submittedByUserId,
    applicantConfirmedAt: params.applicantConfirmedAt ?? null,
    capturedAt: new Date().toISOString(),
  };
}

export async function bindClientAttribution(params: {
  clientId: string;
  introducerId: string;
  referralToken: string;
  actorUserId?: string | null;
}) {
  const db = getDb();
  const [client] = await db
    .select()
    .from(schema.canonicalClients)
    .where(eq(schema.canonicalClients.id, params.clientId))
    .limit(1);
  if (!client) throw new ReferralError("CLIENT_NOT_FOUND", "Client not found.");

  if (!client.introducerId) {
    await db
      .update(schema.canonicalClients)
      .set({ introducerId: params.introducerId, referralToken: params.referralToken })
      .where(eq(schema.canonicalClients.id, params.clientId));
    await writeAudit({
      actorUserId: params.actorUserId,
      action: "referral.attributed",
      resourceType: "canonical_client",
      resourceId: params.clientId,
      metadata: { introducerId: params.introducerId, token: params.referralToken },
    });
    return { bound: true as const, conflict: false };
  }

  if (client.introducerId === params.introducerId) {
    return { bound: false as const, conflict: false };
  }

  await writeAudit({
    actorUserId: params.actorUserId,
    action: "referral.conflict",
    resourceType: "canonical_client",
    resourceId: params.clientId,
    reason: "Existing introducer attribution differs from referral token.",
    metadata: {
      existingIntroducerId: client.introducerId,
      attemptedIntroducerId: params.introducerId,
    },
  });
  return { bound: false as const, conflict: true };
}

export function parseReferralContext(raw: unknown): ReferralContext | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.introducerId !== "string" || typeof o.tokenUsed !== "string") return null;
  return o as ReferralContext;
}

export async function assertApplicantReferralConfirmed(applicationId: string) {
  const db = getDb();
  const [app] = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.id, applicationId))
    .limit(1);
  if (!app?.currentRevisionId) return;

  const [revision] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
    .limit(1);

  const ctx = parseReferralContext(revision.referralContext);
  if (!ctx?.onBehalf) return;

  if (!ctx.applicantConfirmedAt && !revision.confirmedAt) {
    throw new ReferralError(
      "APPLICANT_CONFIRMATION_REQUIRED",
      "Applicant confirmation is required before this action."
    );
  }
}

export async function getIntroducerIdForUser(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ introducerId: schema.memberships.introducerId })
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.role, "introducer"),
        eq(schema.memberships.active, true)
      )
    )
    .limit(1);
  return row?.introducerId ?? null;
}
