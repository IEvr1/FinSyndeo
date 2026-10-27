import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { buildProviderResponsesHtml } from "@/lib/documents/provider-export";
import type { ProviderDraftState } from "@/lib/provider-apply/types";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");

  const body = await request.json();
  const state = body.state as ProviderDraftState;
  if (!state?.core) {
    return NextResponse.json({ error: "Profile state is required." }, { status: 400 });
  }

  const status = String(body.status ?? "Draft");
  const html = buildProviderResponsesHtml(state, {
    status,
    downloadedAt: new Date().toISOString(),
    revisionLabel: body.revisionLabel ? String(body.revisionLabel) : undefined,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="SOPHIMA-AI-provider-responses.html"`,
    },
  });
}
