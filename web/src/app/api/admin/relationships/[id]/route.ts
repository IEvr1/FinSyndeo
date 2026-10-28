import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { assertAdmin, loadAuthContext, PermissionError } from "@/lib/permissions";
import {
  setRelationshipStatus,
  recordFinancingDisbursement,
  RelationshipError,
} from "@/lib/services/relationships";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  try {
    if (body.action === "financing_disbursement") {
      const rel = await recordFinancingDisbursement({
        relationshipId: id,
        amountMinor: body.amountMinor,
        currency: body.currency,
        evidenceReference: body.evidenceReference,
        actorUserId: user.id,
      });
      return NextResponse.json({ relationship: rel });
    }

    await setRelationshipStatus({
      relationshipId: id,
      status: body.status,
      ddClear: body.ddClear,
      evidence: body.evidence,
      actorUserId: user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof RelationshipError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }
}
