import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { assertAdmin, loadAuthContext, PermissionError } from "@/lib/permissions";
import { recordSupplierPayment, CommissionError } from "@/lib/services/commissions";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  try {
    assertAdmin(ctx);
  } catch (e) {
    if (e instanceof PermissionError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const body = await request.json();
  const { invoiceId, amountMinor, currency, valueDate, bankReference } = body;
  if (!invoiceId || !amountMinor || !currency || !valueDate || !bankReference) {
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 });
  }

  try {
    const payment = await recordSupplierPayment({
      invoiceId,
      amountMinor,
      currency,
      valueDate: new Date(valueDate),
      bankReference,
      recordedByUserId: user.id,
    });
    return NextResponse.json({ payment });
  } catch (e) {
    if (e instanceof CommissionError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }
}
