import { eq, and, desc, isNull } from "drizzle-orm";
import { createHash } from "crypto";
import { getDb, schema } from "@/lib/db";
import { evaluateMatches, fixtureProfile } from "@/lib/matching";
import { applicantEmailVars } from "@/lib/email/vars";
import { enqueueEmail } from "@/lib/services/outbox";

export async function getApplicationForOwner(applicationId: string, ownerUserId: string) {
  const db = getDb();
  const [app] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.ownerUserId, ownerUserId)))
    .limit(1);
  return app ?? null;
}

export async function patchDraft(
  applicationId: string,
  ownerUserId: string,
  typedData: Record<string, unknown>,
  expectedHash?: string
) {
  const db = getDb();
  const app = await getApplicationForOwner(applicationId, ownerUserId);
  if (!app?.currentRevisionId) throw new Error("Application not found.");

  const [current] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
    .limit(1);

  if (expectedHash && current.contentHash !== expectedHash) {
    const err = new Error("Revision conflict. Reload and retry.");
    (err as Error & { code: string }).code = "ETAG_MISMATCH";
    throw err;
  }

  const hash = createHash("sha256").update(JSON.stringify(typedData)).digest("hex");
  await db
    .update(schema.assessmentRevisions)
    .set({ typedData, contentHash: hash })
    .where(eq(schema.assessmentRevisions.id, current.id));

  await db
    .update(schema.applications)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(schema.applications.id, applicationId));

  return { revisionId: current.id, contentHash: hash };
}

export async function confirmRevision(
  applicationId: string,
  ownerUserId: string,
  userId: string,
  contactEmail?: string,
  contactFirstName?: string
) {
  const db = getDb();
  const app = await getApplicationForOwner(applicationId, ownerUserId);
  if (!app?.currentRevisionId) throw new Error("Application not found.");

  const [current] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
    .limit(1);

  await db
    .update(schema.assessmentRevisions)
    .set({ confirmedAt: new Date(), confirmedByUserId: userId })
    .where(eq(schema.assessmentRevisions.id, current.id));

  await db
    .update(schema.applications)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(schema.applications.id, applicationId));

  await db
    .update(schema.sharingApprovals)
    .set({ withdrawnAt: new Date() })
    .where(
      and(
        eq(schema.sharingApprovals.applicationId, applicationId),
        isNull(schema.sharingApprovals.withdrawnAt)
      )
    );

  if (contactEmail) {
    const vars = applicantEmailVars({
      firstName: contactFirstName,
      caseReference: applicationId,
      service: app.route,
    });
    await enqueueEmail({
      templateId: "E02",
      businessEvent: "application.confirmed",
      idempotencyKey: `E02:${applicationId}:${current.revisionNumber}`,
      to: [contactEmail],
      vars,
      revisionId: current.id,
    });
  }

  return current;
}

export async function createNewRevision(applicationId: string, ownerUserId: string, typedData: Record<string, unknown>) {
  const db = getDb();
  const app = await getApplicationForOwner(applicationId, ownerUserId);
  if (!app) throw new Error("Application not found.");

  const [latest] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.applicationId, applicationId))
    .orderBy(desc(schema.assessmentRevisions.revisionNumber))
    .limit(1);

  const nextNumber = (latest?.revisionNumber ?? 0) + 1;
  const hash = createHash("sha256").update(JSON.stringify(typedData)).digest("hex");

  const [revision] = await db
    .insert(schema.assessmentRevisions)
    .values({
      applicationId,
      revisionNumber: nextNumber,
      typedData,
      contentHash: hash,
      previousRevisionId: latest?.id,
    })
    .returning();

  await db
    .update(schema.applications)
    .set({ currentRevisionId: revision.id, status: "draft", updatedAt: new Date() })
    .where(eq(schema.applications.id, applicationId));

  return revision;
}

export async function computeMatches(
  applicationId: string,
  ownerUserId: string,
  contactEmail?: string,
  contactFirstName?: string
) {
  const db = getDb();
  const app = await getApplicationForOwner(applicationId, ownerUserId);
  if (!app?.currentRevisionId) throw new Error("Application not found.");

  const [revision] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
    .limit(1);

  if (!revision.confirmedAt) throw new Error("Confirm the assessment before matching.");

  const providers = await db.select().from(schema.providers).where(eq(schema.providers.active, true));
  const providerList = providers.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.legalName,
    country: p.country,
    approved: p.approved,
    agreement: p.agreementSigned,
    active: p.active,
    introEligible: true,
  }));

  const profiles: Record<string, Record<string, unknown>> = {};
  for (const p of providerList) {
    profiles[p.id] = fixtureProfile(p);
  }

  const result = evaluateMatches(
    revision.typedData as Record<string, unknown>,
    providerList,
    profiles
  );

  await db.insert(schema.matchSnapshots).values({
    applicationId,
    revisionId: revision.id,
    results: result,
    eligibleCount: result.eligibleCount,
    conditionalCount: result.conditionalCount,
  });

  await db
    .update(schema.applications)
    .set({ status: "matching", updatedAt: new Date() })
    .where(eq(schema.applications.id, applicationId));

  if (contactEmail) {
    const vars = applicantEmailVars({
      firstName: contactFirstName,
      caseReference: applicationId,
      service: app.route,
    });
    const templateId = result.eligibleCount > 0 || result.conditionalCount > 0 ? "E04" : "E05";
    await enqueueEmail({
      templateId,
      businessEvent: "matching.completed",
      idempotencyKey: `${templateId}:${applicationId}:${revision.id}`,
      to: [contactEmail],
      vars,
      revisionId: revision.id,
    });
  }

  return result;
}

export async function listIntroductionRequests(applicationId: string, ownerUserId: string) {
  const app = await getApplicationForOwner(applicationId, ownerUserId);
  if (!app) throw new Error("Application not found.");
  const db = getDb();
  return db
    .select()
    .from(schema.introductionRequests)
    .where(eq(schema.introductionRequests.applicationId, applicationId));
}

export async function getProviderPublicSummary(providerId: string) {
  const db = getDb();
  const [p] = await db
    .select({
      id: schema.providers.id,
      code: schema.providers.code,
      legalName: schema.providers.legalName,
      country: schema.providers.country,
    })
    .from(schema.providers)
    .where(eq(schema.providers.id, providerId))
    .limit(1);
  return p ?? null;
}
