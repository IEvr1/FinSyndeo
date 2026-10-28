import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { assertAdmin, loadAuthContext, PermissionError } from "@/lib/permissions";
import { publishIntroducerAgreements } from "@/lib/services/agreements";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const agreements = await publishIntroducerAgreements(id, user.id);
  return NextResponse.json({ agreements });
}
