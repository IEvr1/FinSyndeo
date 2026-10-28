import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { evaluateReleaseGate, evaluateCheckoutGate } from "@/lib/release-gate";
import { runScreeningForSubjects, type ScreeningSubject } from "@/lib/screening";
import { buildClientProfileHtml, buildInternalDdReportHtml } from "@/lib/documents/profiles";
import { createPaymentCheckout, gateEmail, sendEmail } from "@/lib/integrations";
import { renderEmailHtml, renderSubject } from "@/lib/email/templates";
import { applicantEmailVars } from "@/lib/email/vars";
import { enqueueEmail } from "@/lib/services/outbox";
import { consumesOneEntitlement } from "@/lib/accounting";
import { assertApplicantReferralConfirmed } from "@/lib/services/referrals";
import { ensureRelationship } from "@/lib/services/relationships";
import { createHash } from "crypto";

export async function requestIntroduction(params: {
  applicationId: string;
  providerId: string;
  ownerUserId: string;
  acceptedQuote: boolean;
}) {
  const db = getDb();
  const [app] = await db
    .select()
    .from(schema.applications)
    .where(
      and(
        eq(schema.applications.id, params.applicationId),
        eq(schema.applications.ownerUserId, params.ownerUserId)
      )
    )
    .limit(1);

  if (!app?.currentRevisionId) throw new Error("Application not found.");
  if (!params.acceptedQuote) throw new Error("Confirm the introduction terms first.");
  await assertApplicantReferralConfirmed(params.applicationId);

  const entitlementUnits = consumesOneEntitlement([app.route]);
  const [client] = await db
    .select()
    .from(schema.canonicalClients)
    .where(eq(schema.canonicalClients.id, app.clientId))
    .limit(1);

  const requiresPayment = (client?.freeIntroductionsUsed ?? 0) >= 3;

  const [intro] = await db
    .insert(schema.introductionRequests)
    .values({
      applicationId: app.id,
      revisionId: app.currentRevisionId,
      providerId: params.providerId,
      entitlementType: requiresPayment ? "paid" : "free",
      paymentStatus: requiresPayment ? "required" : "not_required",
      status: requiresPayment ? "awaiting_payment" : "requested",
    })
    .returning();

  if (client) {
    await ensureRelationship({
      applicationId: app.id,
      clientId: client.id,
      providerId: params.providerId,
      product: app.route,
    });
  }

  return intro;
}

export async function approveSharing(params: {
  applicationId: string;
  ownerUserId: string;
  providerId: string;
  institutionLegalName: string;
  recipientEmail: string;
  recipientName?: string;
  purpose: string;
  privacyNoticeVersion: string;
}) {
  const db = getDb();
  const [app] = await db
    .select()
    .from(schema.applications)
    .where(
      and(
        eq(schema.applications.id, params.applicationId),
        eq(schema.applications.ownerUserId, params.ownerUserId)
      )
    )
    .limit(1);

  if (!app?.currentRevisionId) throw new Error("Application not found.");
  await assertApplicantReferralConfirmed(params.applicationId);

  const [revision] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
    .limit(1);

  const typed = revision.typedData as Record<string, unknown>;
  const applicant = typed.applicant as Record<string, unknown> | undefined;

  const profileHtml = buildClientProfileHtml({
    caseId: app.id,
    applicantName: String(applicant?.name ?? "Applicant"),
    service: app.route,
    revision: revision.revisionNumber,
    route: app.route as "bank",
    fields: [{ label: "Entity", value: String(applicant?.jurisdiction ?? "Not supplied") }],
    recipientEmail: params.recipientEmail,
    institutionLegalName: params.institutionLegalName,
  });

  const ddHtml = buildInternalDdReportHtml({
    caseId: app.id,
    applicantName: String(applicant?.name ?? "Applicant"),
    revision: revision.revisionNumber,
    screeningSummary: "Screening subject to live source availability.",
    contradictions: "None recorded.",
    releaseDecision: "Pending release gate.",
  });

  const profileHash = createHash("sha256").update(profileHtml).digest("hex");
  const ddHash = createHash("sha256").update(ddHtml).digest("hex");

  const [profileDoc] = await db
    .insert(schema.documents)
    .values({
      ownerType: "application",
      ownerId: app.id,
      classification: "institution_profile",
      fileName: `profile-rev${revision.revisionNumber}.html`,
      storageKey: `profiles/${app.id}/${revision.id}.html`,
      contentHash: profileHash,
      mimeType: "text/html",
    })
    .returning();

  await db.insert(schema.documents).values({
    ownerType: "application",
    ownerId: app.id,
    classification: "internal_dd_report",
    fileName: `dd-rev${revision.revisionNumber}.html`,
    storageKey: `internal-dd/${app.id}/${revision.id}.html`,
    contentHash: ddHash,
    mimeType: "text/html",
  });

  const [approval] = await db
    .insert(schema.sharingApprovals)
    .values({
      applicationId: app.id,
      revisionId: revision.id,
      providerId: params.providerId,
      institutionLegalName: params.institutionLegalName,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      purpose: params.purpose,
      documentManifest: [{ documentId: profileDoc.id, classification: "institution_profile" }],
      privacyNoticeVersion: params.privacyNoticeVersion,
      approvedByUserId: params.ownerUserId,
    })
    .returning();

  await db
    .update(schema.applications)
    .set({ status: "sharing_authorised", updatedAt: new Date() })
    .where(eq(schema.applications.id, app.id));

  const contact = typed.context as { contact?: { email?: string; name?: string } } | undefined;
  const email = contact?.contact?.email;
  if (email) {
    const vars = {
      ...applicantEmailVars({
        firstName: contact?.contact?.name?.split(" ")[0],
        caseReference: app.id,
        service: app.route,
      }),
      "institution legal name": params.institutionLegalName,
    };
    await enqueueEmail({
      templateId: "E08",
      businessEvent: "sharing.approved",
      idempotencyKey: `E08:${approval.id}`,
      to: [email],
      vars,
      revisionId: revision.id,
    });
  }

  return approval;
}

export async function releaseIntroduction(introductionId: string, actorUserId: string) {
  const db = getDb();
  const [intro] = await db
    .select()
    .from(schema.introductionRequests)
    .where(eq(schema.introductionRequests.id, introductionId))
    .limit(1);

  if (!intro) throw new Error("Introduction not found.");

  const [app] = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.id, intro.applicationId))
    .limit(1);

  const [revision] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.id, intro.revisionId))
    .limit(1);

  const [approval] = await db
    .select()
    .from(schema.sharingApprovals)
    .where(
      and(
        eq(schema.sharingApprovals.applicationId, intro.applicationId),
        eq(schema.sharingApprovals.providerId, intro.providerId),
        eq(schema.sharingApprovals.revisionId, intro.revisionId)
      )
    )
    .limit(1);

  const typed = revision.typedData as Record<string, unknown>;
  const subjects = (typed.screeningSubjects as ScreeningSubject[]) ?? [];

  const screeningRuns = await runScreeningForSubjects(subjects, {});

  const docs = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.ownerId, intro.applicationId));

  const hasDd = docs.some((d) => d.classification === "internal_dd_report");
  const hasProfile = docs.some((d) => d.classification === "institution_profile");

  const gate = evaluateReleaseGate({
    hasCurrentRevision: Boolean(revision.confirmedAt),
    sharingApprovalValid: Boolean(approval && !approval.withdrawnAt),
    sharingRevisionMatches: approval?.revisionId === intro.revisionId,
    screeningRuns,
    requiresPayment: intro.paymentStatus === "required",
    paymentVerified: intro.paymentStatus === "verified",
    ddReportSeparate: hasDd,
    profileAttachedNotDd: hasProfile && !docs.some((d) => d.classification === "internal_dd_report" && approval?.documentManifest?.toString().includes(d.id)),
  });

  if (!gate.allowed) {
    return { released: false, holds: gate.holds };
  }

  const emailGate = gateEmail();
  if (emailGate.ready && approval) {
    const vars = {
      ...applicantEmailVars({
        caseReference: app!.id,
        service: app!.route,
      }),
      "institution name": approval.institutionLegalName,
      "banker name and institution": `${approval.recipientName ?? approval.recipientEmail} · ${approval.institutionLegalName}`,
    };
    await sendEmail({
      to: [approval.recipientEmail],
      subject: renderSubject("E10", vars),
      html: renderEmailHtml("E10", vars),
      idempotencyKey: `release-${intro.id}`,
    });
  }

  await db
    .update(schema.introductionRequests)
    .set({ status: "released", releasedAt: new Date() })
    .where(eq(schema.introductionRequests.id, intro.id));

  await db.insert(schema.auditEvents).values({
    actorUserId,
    action: "introduction.released",
    resourceType: "introduction_request",
    resourceId: intro.id,
  });

  return { released: true, holds: [] };
}

export async function createCheckout(introductionId: string, ownerUserId: string) {
  const checkoutGate = evaluateCheckoutGate();
  if (!checkoutGate.allowed) {
    return { error: checkoutGate.holds.join(" ") };
  }

  const db = getDb();
  const [intro] = await db
    .select()
    .from(schema.introductionRequests)
    .where(eq(schema.introductionRequests.id, introductionId))
    .limit(1);

  if (!intro) return { error: "Introduction not found." };

  const result = await createPaymentCheckout({
    amountMinor: 25000,
    currency: "EUR",
    idempotencyKey: `checkout-${intro.id}`,
    metadata: { introductionId: intro.id },
  });

  return result;
}
