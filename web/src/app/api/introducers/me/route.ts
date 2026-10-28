import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { getIntroducerIdForUser, isLinkActive } from "@/lib/services/referrals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "introducer");

  const introducerId = await getIntroducerIdForUser(user.id);
  if (!introducerId) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  const db = getDb();
  const [introducer] = await db
    .select()
    .from(schema.introducers)
    .where(eq(schema.introducers.id, introducerId))
    .limit(1);

  if (!introducer) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  const linkActive = await isLinkActive(introducer.id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const referralUrl = `${baseUrl}/apply/ref/${introducer.referralToken}`;

  return NextResponse.json({
    introducer: {
      id: introducer.id,
      displayName: introducer.displayName,
      email: introducer.email,
      status: introducer.status,
      linkSuspended: introducer.linkSuspended,
      referralToken: introducer.referralToken,
      referralUrl,
      linkActive,
      tierAchieved: introducer.tierAchieved,
    },
  });
}
