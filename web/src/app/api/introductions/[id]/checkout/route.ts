import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { createCheckout } from "@/lib/services/introductions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");
  const { id } = await params;
  const result = await createCheckout(id, user.id);
  if (result.error) return NextResponse.json(result, { status: 422 });
  return NextResponse.json(result);
}
