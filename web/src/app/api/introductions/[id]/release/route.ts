import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, assertAdmin } from "@/lib/permissions";
import { releaseIntroduction } from "@/lib/services/introductions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await loadAuthContext(user);
    assertAdmin(ctx);
    const { id } = await params;
    const result = await releaseIntroduction(id, user.id);
    return NextResponse.json(result, { status: result.released ? 200 : 422 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
