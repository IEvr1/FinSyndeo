import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { buildClientProfileHtml, type ProfileRoute } from "@/lib/documents/profiles";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");

  const route = (new URL(request.url).searchParams.get("route") ?? "bank") as ProfileRoute;
  const html = buildClientProfileHtml({
    caseId: "SAMPLE-0001",
    applicantName: "Sample Applicant Ltd",
    service: "Business bank accounts",
    revision: 1,
    route,
    recipientEmail: "referrals@example-institution.test",
    institutionLegalName: "Sample Institution (fictional)",
    fields: [
      { label: "Legal name", value: "Sample Applicant Ltd" },
      { label: "Jurisdiction", value: "Cyprus" },
      { label: "Industry", value: "Software, IT & telecommunications" },
      { label: "Requested service", value: "Business bank accounts" },
      { label: "Purpose", value: "Operational receipts and payments (sample)" },
    ],
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
