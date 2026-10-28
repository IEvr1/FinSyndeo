import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  agreementHasUnresolvedPlaceholders,
  buildAgreementDraft,
} from "@/lib/agreements/content";
import {
  AGREEMENT_TYPE_MASTER,
  AGREEMENT_TYPE_SCHEDULE,
} from "@/lib/referrals/constants";
import { writeAudit } from "@/lib/services/audit";
import { isActionBlocked } from "@/lib/unresolved";
import { enqueueEmail } from "@/lib/services/outbox";

const AGREEMENT_VERSION = "2026-10-07-draft";

export async function publishIntroducerAgreements(introducerId: string, actorUserId: string) {
  const db = getDb();
  const [introducer] = await db
    .select()
    .from(schema.introducers)
    .where(eq(schema.introducers.id, introducerId))
    .limit(1);
  if (!introducer) throw new Error("Introducer not found.");

  const types = [
    { type: AGREEMENT_TYPE_MASTER, content: buildAgreementDraft("master") },
    { type: AGREEMENT_TYPE_SCHEDULE, content: buildAgreementDraft("standard") },
  ];

  const created = [];
  for (const doc of types) {
    const hash = createHash("sha256").update(doc.content).digest("hex");
    const [row] = await db
      .insert(schema.agreements)
      .values({
        introducerId,
        agreementType: doc.type,
        version: AGREEMENT_VERSION,
        content: doc.content,
        contentHash: hash,
        status: "awaiting_acceptance",
        hasUnresolvedPlaceholders: agreementHasUnresolvedPlaceholders(doc.content),
      })
      .returning();
    created.push(row);
  }

  await enqueueEmail({
    templateId: "E17",
    businessEvent: "introducer.agreement_invited",
    idempotencyKey: `E17:${introducerId}:${AGREEMENT_VERSION}`,
    to: [introducer.email],
    vars: {
      "introducer contact name": introducer.displayName,
      "secure invitation link": `/introducer/documents`,
      version: AGREEMENT_VERSION,
    },
  });

  await writeAudit({
    actorUserId,
    action: "agreement.published",
    resourceType: "introducer",
    resourceId: introducerId,
    metadata: { agreementIds: created.map((c) => c.id) },
  });

  return created;
}

export async function acceptAgreement(params: {
  agreementId: string;
  introducerId: string;
  userId: string;
}) {
  const db = getDb();
  const [agreement] = await db
    .select()
    .from(schema.agreements)
    .where(eq(schema.agreements.id, params.agreementId))
    .limit(1);
  if (!agreement || agreement.introducerId !== params.introducerId) {
    throw new Error("Agreement not found.");
  }
  if (agreement.status === "accepted") return agreement;

  await db
    .update(schema.agreements)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
      acceptedByUserId: params.userId,
    })
    .where(eq(schema.agreements.id, params.agreementId));

  await writeAudit({
    actorUserId: params.userId,
    action: "agreement.accepted",
    resourceType: "agreement",
    resourceId: params.agreementId,
    metadata: { agreementType: agreement.agreementType },
  });

  await maybeActivateIntroducer(params.introducerId);

  const [updated] = await db
    .select()
    .from(schema.agreements)
    .where(eq(schema.agreements.id, params.agreementId))
    .limit(1);
  return updated!;
}

async function maybeActivateIntroducer(introducerId: string) {
  const db = getDb();
  const master = await db
    .select()
    .from(schema.agreements)
    .where(
      and(
        eq(schema.agreements.introducerId, introducerId),
        eq(schema.agreements.agreementType, AGREEMENT_TYPE_MASTER),
        eq(schema.agreements.status, "accepted")
      )
    )
    .limit(1);
  const schedule = await db
    .select()
    .from(schema.agreements)
    .where(
      and(
        eq(schema.agreements.introducerId, introducerId),
        eq(schema.agreements.agreementType, AGREEMENT_TYPE_SCHEDULE),
        eq(schema.agreements.status, "accepted")
      )
    )
    .limit(1);
  if (!master.length || !schedule.length) return;

  const activationBlock = isActionBlocked("introducer_activation");
  const nextStatus = activationBlock.blocked ? "invited" : "active";

  await db
    .update(schema.introducers)
    .set({ status: nextStatus })
    .where(eq(schema.introducers.id, introducerId));
}
