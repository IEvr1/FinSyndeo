import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { ReferralContext } from "@/lib/referrals/constants";
import {
  bindClientAttribution,
  isLinkActiveForToken,
  ReferralError,
  buildReferralContext,
} from "@/lib/services/referrals";

function identityKeyFromTyped(typedData: Record<string, unknown>, fallbackEmail: string) {
  const applicant = typedData?.applicant as Record<string, unknown> | undefined;
  if (applicant?.registration && applicant?.jurisdiction) {
    return {
      key: `entity:${applicant.jurisdiction}:${applicant.registration}`,
      type: "entity" as const,
      displayName: String(applicant.name ?? fallbackEmail),
    };
  }
  return {
    key: `person:${fallbackEmail}`,
    type: "person" as const,
    displayName: String(applicant?.name ?? fallbackEmail),
  };
}

export async function createApplicationForUser(params: {
  ownerUserId: string;
  ownerEmail: string;
  route: string;
  typedData: Record<string, unknown>;
  submittedByUserId: string;
  referralToken?: string | null;
  referralContext?: ReferralContext | null;
  skipReferralBind?: boolean;
}) {
  const db = getDb();
  const typedData = params.typedData ?? {};
  const identity = identityKeyFromTyped(typedData, params.ownerEmail);

  let [client] = await db
    .select()
    .from(schema.canonicalClients)
    .where(eq(schema.canonicalClients.identityKey, identity.key))
    .limit(1);

  if (!client) {
    [client] = await db
      .insert(schema.canonicalClients)
      .values({
        identityType: identity.type,
        identityKey: identity.key,
        displayName: identity.displayName,
      })
      .returning();
  }

  let referralContext = params.referralContext ?? null;

  if (params.referralToken && !params.skipReferralBind) {
    const { active, introducer } = await isLinkActiveForToken(params.referralToken);
    if (!active || !introducer) {
      throw new ReferralError("REFERRAL_INACTIVE", "This referral link is unavailable.");
    }
    const bind = await bindClientAttribution({
      clientId: client.id,
      introducerId: introducer.id,
      referralToken: params.referralToken,
      actorUserId: params.submittedByUserId,
    });
    if (bind.conflict) {
      throw new ReferralError(
        "REFERRAL_CONFLICT",
        "This client is already attributed to another introducer."
      );
    }
    if (!referralContext) {
      referralContext = buildReferralContext({
        introducerId: introducer.id,
        tokenUsed: params.referralToken,
        onBehalf: false,
        submittedByUserId: params.submittedByUserId,
      });
    }
  }

  const [app] = await db
    .insert(schema.applications)
    .values({
      ownerUserId: params.ownerUserId,
      clientId: client.id,
      route: params.route ?? "bank",
      status: "draft",
    })
    .returning();

  const hash = createHash("sha256").update(JSON.stringify(typedData)).digest("hex");
  const [revision] = await db
    .insert(schema.assessmentRevisions)
    .values({
      applicationId: app.id,
      revisionNumber: 1,
      typedData,
      contentHash: hash,
      referralContext: referralContext ?? undefined,
    })
    .returning();

  await db
    .update(schema.applications)
    .set({ currentRevisionId: revision.id })
    .where(eq(schema.applications.id, app.id));

  return { application: app, revision, client };
}
