import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole, PermissionError } from "@/lib/permissions";
import { acceptAgreement } from "@/lib/services/agreements";
import { getIntroducerIdForUser } from "@/lib/services/referrals";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  try {
    requireRole(ctx, "introducer");
  } catch (e) {
    if (e instanceof PermissionError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const introducerId = await getIntroducerIdForUser(user.id);
  if (!introducerId) return NextResponse.json({ error: "Introducer profile not found." }, { status: 404 });

  try {
    const agreement = await acceptAgreement({
      agreementId: id,
      introducerId,
      userId: user.id,
    });
    return NextResponse.json({ agreement });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
