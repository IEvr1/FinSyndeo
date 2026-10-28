import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { getIntroducerIdForUser } from "@/lib/services/referrals";
import { createSupplierInvoice, CommissionError } from "@/lib/services/commissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "introducer");

  const introducerId = await getIntroducerIdForUser(user.id);
  if (!introducerId) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  const db = getDb();
  const invoices = await db
    .select()
    .from(schema.supplierInvoices)
    .where(eq(schema.supplierInvoices.introducerId, introducerId))
    .orderBy(desc(schema.supplierInvoices.createdAt));

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "introducer");

  const introducerId = await getIntroducerIdForUser(user.id);
  if (!introducerId) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  const body = await request.json();
  const { invoiceNumber, currency, commissionEntryIds, taxMinor } = body;
  if (!invoiceNumber || !currency || !Array.isArray(commissionEntryIds) || commissionEntryIds.length === 0) {
    return NextResponse.json({ error: "Invalid invoice payload." }, { status: 400 });
  }

  try {
    const invoice = await createSupplierInvoice({
      introducerId,
      invoiceNumber,
      currency,
      commissionEntryIds,
      taxMinor: typeof taxMinor === "number" ? taxMinor : 0,
    });
    return NextResponse.json({ invoice });
  } catch (e) {
    if (e instanceof CommissionError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }
}
