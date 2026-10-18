import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { fixtureProfile } from "@/lib/matching";
import { getActiveCountryPolicy, validateCountrySelection } from "@/lib/country-policy";
import { sendPlannedReminders, syncProviderPlannedItems } from "@/lib/provider-apply/planned-sync";
import type { ProviderDraftState } from "@/lib/provider-apply/types";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");

  const membership = ctx.memberships.find((m) => m.role === "provider");
  if (!membership?.providerId) {
    return NextResponse.json({ error: "No provider membership." }, { status: 403 });
  }

  const body = await request.json();
  if (body.country) {
    const check = validateCountrySelection("group1", [body.country]);
    if (!check.valid) {
      return NextResponse.json(
        { error: check.message ?? "Incorporation country is not accepted under the exclusion policy." },
        { status: 400 }
      );
    }
  }

  const wizardState = body.wizardState as ProviderDraftState | undefined;
  const licenseCountries =
    wizardState?.licenses
      ?.map((l) => String(l.data?.country ?? "").trim())
      .filter(Boolean) ?? [];
  if (licenseCountries.length) {
    const check = validateCountrySelection("group1", licenseCountries);
    if (!check.valid) {
      return NextResponse.json(
        {
          error:
            check.message ??
            "Authorisation jurisdiction is not accepted under the exclusion policy.",
          rejected: check.rejected,
        },
        { status: 400 }
      );
    }
  }

  const policy = getActiveCountryPolicy();
  const db = getDb();

  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.id, membership.providerId))
    .limit(1);

  if (!provider) return NextResponse.json({ error: "Provider not found." }, { status: 404 });

  const submitForReview = body.submitForReview === true;
  const mergedProfile = body.profileData
    ? {
        ...body.profileData,
        core: {
          ...(body.profileData.core ?? {}),
          legalName: body.legalName ?? body.profileData.core?.legalName ?? provider.legalName,
          country: body.country ?? body.profileData.core?.country ?? provider.country,
        },
        exclusionPolicyVersion: policy.version,
      }
    : (() => {
        const profileData = fixtureProfile({
          id: provider.id,
          code: provider.code,
          name: body.legalName ?? provider.legalName,
          country: body.country ?? provider.country,
          approved: provider.approved,
          agreement: provider.agreementSigned,
          active: provider.active,
        });
        return {
          ...profileData,
          core: { ...((profileData.core as object) ?? {}), legalName: body.legalName },
          exclusionPolicyVersion: policy.version,
        };
      })();

  const revisions = await db
    .select()
    .from(schema.providerOfferRevisions)
    .where(eq(schema.providerOfferRevisions.providerId, provider.id));
  const latest = revisions.sort((a, b) => b.revisionNumber - a.revisionNumber)[0];

  const revisionNumber = (latest?.revisionNumber ?? 0) + 1;
  const approvalStatus = submitForReview ? "submitted" : "draft";

  await db.insert(schema.providerOfferRevisions).values({
    providerId: provider.id,
    revisionNumber,
    profileData: mergedProfile,
    approvalStatus,
  });

  if (body.legalName || body.country) {
    await db
      .update(schema.providers)
      .set({
        legalName: body.legalName ?? provider.legalName,
        country: body.country ?? provider.country,
      })
      .where(eq(schema.providers.id, provider.id));
  }

  if (wizardState) {
    await syncProviderPlannedItems(membership.providerId, {
      ...wizardState,
      exclusionPolicyVersion: policy.version,
    });
    await sendPlannedReminders(membership.providerId);
  }

  return NextResponse.json({
    saved: true,
    revisionNumber,
    approvalStatus,
    exclusionPolicyVersion: policy.version,
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");

  const membership = ctx.memberships.find((m) => m.role === "provider");
  if (!membership?.providerId) {
    return NextResponse.json({ error: "No provider membership." }, { status: 403 });
  }

  const db = getDb();
  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.id, membership.providerId))
    .limit(1);
  if (!provider) return NextResponse.json({ error: "Provider not found." }, { status: 404 });

  const revisions = await db
    .select()
    .from(schema.providerOfferRevisions)
    .where(eq(schema.providerOfferRevisions.providerId, provider.id));
  const sorted = revisions.sort((a, b) => b.revisionNumber - a.revisionNumber);
  const latest = sorted[0];
  const published = sorted.find((r) => r.approvalStatus === "published" || r.publishedAt);

  let statusLabel = "Draft";
  if (!provider.active) statusLabel = "Paused";
  else if (latest?.approvalStatus === "changes_required") statusLabel = "Changes required";
  else if (latest?.approvalStatus === "submitted" || latest?.approvalStatus === "in_review") {
    statusLabel = published ? "Published" : "Submitted for review";
  } else if (provider.approved || published) statusLabel = "Published";

  return NextResponse.json({
    legalName: provider.legalName,
    status: statusLabel,
    approved: provider.approved,
    active: provider.active,
    agreementSigned: provider.agreementSigned,
    latestRevision: latest
      ? { number: latest.revisionNumber, approvalStatus: latest.approvalStatus }
      : null,
    hasPublishedProfile: Boolean(published),
    pendingReview:
      latest?.approvalStatus === "submitted" || latest?.approvalStatus === "in_review",
    exclusionPolicyVersion: getActiveCountryPolicy().version,
  });
}
