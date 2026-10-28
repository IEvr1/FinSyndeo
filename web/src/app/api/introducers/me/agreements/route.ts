import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { getIntroducerIdForUser } from "@/lib/services/referrals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "introducer");

  const introducerId = await getIntroducerIdForUser(user.id);
  if (!introducerId) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  const db = getDb();
  const agreements = await db
    .select({
      id: schema.agreements.id,
      agreementType: schema.agreements.agreementType,
      version: schema.agreements.version,
      status: schema.agreements.status,
      hasUnresolvedPlaceholders: schema.agreements.hasUnresolvedPlaceholders,
      acceptedAt: schema.agreements.acceptedAt,
    })
    .from(schema.agreements)
    .where(eq(schema.agreements.introducerId, introducerId));

  return NextResponse.json({ agreements });
}
