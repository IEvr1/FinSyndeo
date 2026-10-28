import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import {
  buildReferralContext,
  getIntroducerIdForUser,
  isLinkActive,
  ReferralError,
} from "@/lib/services/referrals";
import { createApplicationForUser } from "@/lib/services/application-create";
import { enqueueEmail } from "@/lib/services/outbox";
import { applicantEmailVars } from "@/lib/email/vars";

async function ensureApplicantUser(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, normalized)).limit(1);
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email: normalized, emailVerified: false })
      .returning();
    await db.insert(schema.memberships).values({
      userId: user.id,
      role: "applicant",
      invited: true,
    });
  }
  return user;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "introducer");

  const introducerId = await getIntroducerIdForUser(user.id);
  if (!introducerId) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  const active = await isLinkActive(introducerId);
  if (!active) {
    return NextResponse.json({ error: "Referral link is not active." }, { status: 403 });
  }

  const body = await request.json();
  const { route, typedData, applicantEmail, authorityConfirmed } = body;
  if (!authorityConfirmed) {
    return NextResponse.json(
      { error: "You must confirm the applicant has authorised this submission." },
      { status: 400 }
    );
  }

  const email =
    (typeof applicantEmail === "string" ? applicantEmail : null) ??
    (typedData?.contact as { email?: string } | undefined)?.email ??
    (typedData?.applicant as { email?: string } | undefined)?.email;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Valid applicant contact email is required." }, { status: 400 });
  }

  const db = getDb();
  const [introducer] = await db
    .select()
    .from(schema.introducers)
    .where(eq(schema.introducers.id, introducerId))
    .limit(1);
  if (!introducer) return NextResponse.json({ error: "Introducer not found." }, { status: 404 });

  try {
    const applicantUser = await ensureApplicantUser(email);
    const referralContext = buildReferralContext({
      introducerId,
      tokenUsed: introducer.referralToken,
      onBehalf: true,
      authorityConfirmed: true,
      submittedByUserId: user.id,
      applicantConfirmedAt: null,
    });

    const { application, revision } = await createApplicationForUser({
      ownerUserId: applicantUser.id,
      ownerEmail: applicantUser.email,
      route: route ?? "bank",
      typedData: typedData ?? {},
      submittedByUserId: user.id,
      referralToken: introducer.referralToken,
      referralContext,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const claimLink = `${baseUrl}/auth/sign-in?next=/applicant/assessments`;
    const vars = applicantEmailVars({
      caseReference: application.id,
      service: application.route,
    });

    await enqueueEmail({
      templateId: "E07",
      businessEvent: "referral.on_behalf_submitted",
      idempotencyKey: `E07:${application.id}:1`,
      to: [email],
      vars: {
        ...vars,
        "Introducer name": introducer.displayName,
        "applicant name": String((typedData?.applicant as { name?: string })?.name ?? email),
        "single-use claim link": claimLink,
      },
      revisionId: revision.id,
    });

    return NextResponse.json({ application, revision });
  } catch (e) {
    if (e instanceof ReferralError) {
      const status = e.code === "REFERRAL_CONFLICT" ? 409 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
