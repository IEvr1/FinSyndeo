import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { getIntroducerIdForUser, parseReferralContext } from "@/lib/services/referrals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "introducer");

  const introducerId = await getIntroducerIdForUser(user.id);
  if (!introducerId) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  const db = getDb();
  const clients = await db
    .select()
    .from(schema.canonicalClients)
    .where(eq(schema.canonicalClients.introducerId, introducerId));

  const referrals = [];
  for (const client of clients) {
    const apps = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.clientId, client.id))
      .orderBy(desc(schema.applications.updatedAt));

    for (const app of apps) {
      let onBehalf = false;
      let applicantConfirmed = true;
      if (app.currentRevisionId) {
        const [rev] = await db
          .select()
          .from(schema.assessmentRevisions)
          .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
          .limit(1);
        const rctx = parseReferralContext(rev?.referralContext);
        if (rctx?.onBehalf) {
          onBehalf = true;
          applicantConfirmed = !!(rctx.applicantConfirmedAt || rev?.confirmedAt);
        }
      }
      referrals.push({
        clientId: client.id,
        clientName: client.displayName,
        applicationId: app.id,
        route: app.route,
        status: app.status,
        updatedAt: app.updatedAt,
        onBehalf,
        applicantConfirmed,
      });
    }
  }

  return NextResponse.json({ referrals });
}
