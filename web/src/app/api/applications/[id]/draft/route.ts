import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { patchDraft } from "@/lib/services/applications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await loadAuthContext(user);
    requireRole(ctx, "applicant");
    const { id } = await params;
    const body = await request.json();
    const result = await patchDraft(id, user.id, body.typedData, body.contentHash);
    return NextResponse.json(result);
  } catch (e) {
    const err = e as Error & { code?: string };
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.code === "ETAG_MISMATCH" ? 409 : 400 }
    );
  }
}
