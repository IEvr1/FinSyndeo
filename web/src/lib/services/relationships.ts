import { and, eq, isNotNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { writeAudit } from "@/lib/services/audit";
import { resolveAutomaticTier } from "@/lib/accounting";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted: ["matching_completed", "declined", "cancelled"],
  matching_completed: ["introduction_requested", "declined", "cancelled"],
  introduction_requested: ["introduced", "declined", "cancelled"],
  introduced: ["onboarding", "declined", "cancelled"],
  onboarding: ["activated", "closed", "declined", "cancelled"],
  activated: ["closed"],
  declined: [],
  cancelled: [],
  closed: [],
};

export class RelationshipError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function ensureRelationship(params: {
  applicationId: string;
  clientId: string;
  providerId: string;
  product: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.providerRelationships)
    .where(
      and(
        eq(schema.providerRelationships.applicationId, params.applicationId),
        eq(schema.providerRelationships.providerId, params.providerId)
      )
    )
    .limit(1);
  if (existing) return existing;

  const [row] = await db
    .insert(schema.providerRelationships)
    .values({
      applicationId: params.applicationId,
      clientId: params.clientId,
      providerId: params.providerId,
      product: params.product,
      status: "submitted",
    })
    .returning();
  return row;
}

export async function setRelationshipStatus(params: {
  relationshipId: string;
  status: string;
  ddClear?: boolean;
  evidence?: Record<string, unknown>;
  actorUserId?: string | null;
}) {
  const db = getDb();
  const [rel] = await db
    .select()
    .from(schema.providerRelationships)
    .where(eq(schema.providerRelationships.id, params.relationshipId))
    .limit(1);
  if (!rel) throw new RelationshipError("NOT_FOUND", "Relationship not found.");

  const allowed = ALLOWED_TRANSITIONS[rel.status] ?? [];
  if (rel.status !== params.status && !allowed.includes(params.status)) {
    throw new RelationshipError(
      "INVALID_TRANSITION",
      `Cannot move from ${rel.status} to ${params.status}.`
    );
  }

  const patch: Partial<typeof schema.providerRelationships.$inferInsert> = {
    status: params.status,
    updatedAt: new Date(),
  };
  if (params.ddClear !== undefined) patch.ddClear = params.ddClear;
  if (params.evidence) patch.evidence = params.evidence;
  if (params.status === "activated") patch.activatedAt = new Date();

  await db
    .update(schema.providerRelationships)
    .set(patch)
    .where(eq(schema.providerRelationships.id, params.relationshipId));

  if (params.status === "activated") {
    await bumpIntroducerTierForClient(rel.clientId);
  }

  await writeAudit({
    actorUserId: params.actorUserId,
    action: "relationship.status_changed",
    resourceType: "provider_relationship",
    resourceId: params.relationshipId,
    metadata: { from: rel.status, to: params.status },
  });
}

export async function recordFinancingDisbursement(params: {
  relationshipId: string;
  amountMinor: number;
  currency: string;
  evidenceReference: string;
  actorUserId?: string | null;
}) {
  const db = getDb();
  const [rel] = await db
    .select()
    .from(schema.providerRelationships)
    .where(eq(schema.providerRelationships.id, params.relationshipId))
    .limit(1);
  if (!rel) throw new RelationshipError("NOT_FOUND", "Relationship not found.");
  if (rel.financingFirstDisbursementAt) {
    return rel;
  }

  await db
    .update(schema.providerRelationships)
    .set({
      financingFirstDisbursementAt: new Date(),
      evidence: {
        ...(rel.evidence as Record<string, unknown> | null),
        firstDisbursement: {
          amountMinor: params.amountMinor,
          currency: params.currency,
          reference: params.evidenceReference,
          at: new Date().toISOString(),
        },
      },
      updatedAt: new Date(),
    })
    .where(eq(schema.providerRelationships.id, params.relationshipId));

  await bumpIntroducerTierForClient(rel.clientId);

  await writeAudit({
    actorUserId: params.actorUserId,
    action: "relationship.financing_disbursement",
    resourceType: "provider_relationship",
    resourceId: params.relationshipId,
    metadata: params,
  });

  const [updated] = await db
    .select()
    .from(schema.providerRelationships)
    .where(eq(schema.providerRelationships.id, params.relationshipId))
    .limit(1);
  return updated!;
}

async function bumpIntroducerTierForClient(clientId: string) {
  const db = getDb();
  const [client] = await db
    .select()
    .from(schema.canonicalClients)
    .where(eq(schema.canonicalClients.id, clientId))
    .limit(1);
  if (!client?.introducerId) return;

  const activated = await db
    .select({ clientId: schema.providerRelationships.clientId })
    .from(schema.providerRelationships)
    .where(eq(schema.providerRelationships.status, "activated"));

  const disbursed = await db
    .select({ clientId: schema.providerRelationships.clientId })
    .from(schema.providerRelationships)
    .where(isNotNull(schema.providerRelationships.financingFirstDisbursementAt));

  const successfulClients = new Set<string>();
  for (const r of activated) successfulClients.add(r.clientId);
  for (const r of disbursed) {
    if (r.clientId) successfulClients.add(r.clientId);
  }

  const count = successfulClients.size;
  const [introducer] = await db
    .select()
    .from(schema.introducers)
    .where(eq(schema.introducers.id, client.introducerId))
    .limit(1);
  if (!introducer) return;

  const nextTier = Math.max(introducer.tierAchieved, count);
  if (nextTier !== introducer.tierAchieved) {
    await db
      .update(schema.introducers)
      .set({ tierAchieved: nextTier })
      .where(eq(schema.introducers.id, introducer.id));
  }
}

export function relationshipQualifiesForCommission(rel: {
  status: string;
  product: string;
  financingFirstDisbursementAt: Date | null;
}) {
  if (rel.product === "financing") {
    return !!rel.financingFirstDisbursementAt;
  }
  return rel.status === "activated";
}

export { resolveAutomaticTier };
