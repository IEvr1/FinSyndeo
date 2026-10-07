import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { approveSharing } from "@/lib/services/introductions";

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
    const approval = await approveSharing({
      applicationId: id,
      ownerUserId: user.id,
      providerId: body.providerId,
      institutionLegalName: body.institutionLegalName,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      purpose: body.purpose,
      privacyNoticeVersion: body.privacyNoticeVersion,
    });
    return NextResponse.json({ approval });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
