import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { confirmRevision } from "@/lib/services/applications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await loadAuthContext(user);
    requireRole(ctx, "applicant");
    const { id } = await params;
    const revision = await confirmRevision(id, user.id, user.id, user.email, user.name?.split(" ")[0]);
    return NextResponse.json({ revision });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
