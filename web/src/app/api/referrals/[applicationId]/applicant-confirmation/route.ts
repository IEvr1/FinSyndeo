import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { parseReferralContext } from "@/lib/services/referrals";
import { writeAudit } from "@/lib/services/audit";

function contactEmailFromTyped(typedData: Record<string, unknown>, fallback: string) {
  const contact = typedData.contact as { email?: string } | undefined;
  const applicant = typedData.applicant as { email?: string } | undefined;
  return contact?.email ?? applicant?.email ?? fallback;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");

  const body = await request.json().catch(() => ({}));
  const revisionId = typeof body.revisionId === "string" ? body.revisionId : undefined;

  const db = getDb();
  const [app] = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.id, applicationId))
    .limit(1);

  if (!app || app.ownerUserId !== user.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  if (!app.currentRevisionId) {
    return NextResponse.json({ error: "No current revision." }, { status: 400 });
  }

  if (revisionId && revisionId !== app.currentRevisionId) {
    return NextResponse.json({ error: "Revision mismatch. Reload and retry." }, { status: 409 });
  }

  const [revision] = await db
    .select()
    .from(schema.assessmentRevisions)
    .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
    .limit(1);

  const rctx = parseReferralContext(revision.referralContext);
  if (!rctx?.onBehalf) {
    return NextResponse.json({ error: "This application does not require on-behalf confirmation." }, {
      status: 400,
    });
  }

  const expectedEmail = contactEmailFromTyped(
    revision.typedData as Record<string, unknown>,
    user.email
  ).toLowerCase();
  if (user.email.toLowerCase() !== expectedEmail) {
    return NextResponse.json(
      { error: "Sign in with the applicant contact email to confirm this request." },
      { status: 403 }
    );
  }

  const confirmedAt = new Date().toISOString();
  const updatedContext = {
    ...rctx,
    applicantConfirmedAt: confirmedAt,
  };

  await db
    .update(schema.assessmentRevisions)
    .set({
      referralContext: updatedContext,
      confirmedAt: new Date(),
      confirmedByUserId: user.id,
    })
    .where(eq(schema.assessmentRevisions.id, revision.id));

  await db
    .update(schema.applications)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(schema.applications.id, applicationId));

  await writeAudit({
    actorUserId: user.id,
    action: "referral.applicant_confirmed",
    resourceType: "application",
    resourceId: applicationId,
    metadata: { revisionId: revision.id },
  });

  return NextResponse.json({ confirmed: true, applicationId });
}
