import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { listIntroductionRequests } from "@/lib/services/applications";
import { requestIntroduction } from "@/lib/services/introductions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await loadAuthContext(user);
    requireRole(ctx, "applicant");
    const { id } = await params;
    const rows = await listIntroductionRequests(id, user.id);
    return NextResponse.json({ requests: rows });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(
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
    const intro = await requestIntroduction({
      applicationId: id,
      providerId: body.providerId,
      ownerUserId: user.id,
      acceptedQuote: body.acceptedQuote === true,
    });
    return NextResponse.json({ introduction: intro });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
