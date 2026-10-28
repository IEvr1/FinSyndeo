import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
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
  const entries = await db
    .select({
      id: schema.commissionEntries.id,
      shareMinor: schema.commissionEntries.shareMinor,
      currency: schema.commissionEntries.currency,
      ratePercent: schema.commissionEntries.ratePercent,
      postedAt: schema.commissionEntries.postedAt,
      clientName: schema.canonicalClients.displayName,
      providerName: schema.providers.legalName,
      invoiced: schema.supplierInvoiceAllocations.id,
    })
    .from(schema.commissionEntries)
    .leftJoin(schema.canonicalClients, eq(schema.commissionEntries.clientId, schema.canonicalClients.id))
    .leftJoin(schema.providers, eq(schema.commissionEntries.providerId, schema.providers.id))
    .leftJoin(
      schema.supplierInvoiceAllocations,
      eq(schema.commissionEntries.id, schema.supplierInvoiceAllocations.commissionEntryId)
    )
    .where(eq(schema.commissionEntries.introducerId, introducerId))
    .orderBy(desc(schema.commissionEntries.postedAt));

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      invoiced: !!e.invoiced,
    })),
  });
}
