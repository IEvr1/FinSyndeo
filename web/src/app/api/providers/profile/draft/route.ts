import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { fixtureProfile } from "@/lib/matching";

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

  return NextResponse.json({ saved: true, revisionNumber });
}
