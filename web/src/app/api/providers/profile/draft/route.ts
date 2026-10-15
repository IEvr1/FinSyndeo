import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { fixtureProfile } from "@/lib/matching";
import { validateCountrySelection } from "@/lib/country-policy";
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
  const db = getDb();

  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.id, membership.providerId))
    .limit(1);

  if (!provider) return NextResponse.json({ error: "Provider not found." }, { status: 404 });

  const mergedProfile = body.profileData
    ? {
        ...body.profileData,
        core: {
          ...(body.profileData.core ?? {}),
          legalName: body.legalName ?? body.profileData.core?.legalName ?? provider.legalName,
          country: body.country ?? body.profileData.core?.country ?? provider.country,
        },
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
        };
      })();

  const [latest] = await db
    .select()
    .from(schema.providerOfferRevisions)
    .where(eq(schema.providerOfferRevisions.providerId, provider.id))
    .limit(1);

  const revisionNumber = (latest?.revisionNumber ?? 0) + 1;

  await db.insert(schema.providerOfferRevisions).values({
    providerId: provider.id,
    revisionNumber,
    profileData: mergedProfile,
    approvalStatus: "draft",
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

  const wizardState = body.wizardState as ProviderDraftState | undefined;
  if (wizardState) {
    await syncProviderPlannedItems(membership.providerId, wizardState);
    await sendPlannedReminders(membership.providerId);
  }

  return NextResponse.json({ saved: true, revisionNumber });
}
