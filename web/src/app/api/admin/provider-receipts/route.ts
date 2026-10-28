import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { assertAdmin, loadAuthContext, PermissionError } from "@/lib/permissions";
import { postProviderReceipt, CommissionError, type ReceiptLineInput } from "@/lib/services/commissions";
import type { ReceiptTaxMode } from "@/lib/accounting";

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
  const { header, lines } = body as {
    header: {
      providerId: string;
      bankReference: string;
      currency: string;
      valueDate: string;
      verifiedCashMinor: number;
      statementReference?: string;
      periodLabel?: string;
    };
    lines: ReceiptLineInput[];
  };

  if (!header?.providerId || !header.bankReference || !Array.isArray(lines)) {
    return NextResponse.json({ error: "Invalid receipt payload." }, { status: 400 });
  }

  try {
    const result = await postProviderReceipt(
      {
        providerId: header.providerId,
        bankReference: header.bankReference,
        currency: header.currency,
        valueDate: new Date(header.valueDate),
        verifiedCashMinor: header.verifiedCashMinor,
        statementReference: header.statementReference,
        periodLabel: header.periodLabel,
        verifiedByUserId: user.id,
      },
      lines.map((l) => ({
        ...l,
        taxMode: l.taxMode as ReceiptTaxMode,
      }))
    );
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof CommissionError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }
}
