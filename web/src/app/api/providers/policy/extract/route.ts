import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { extractAcceptancePolicy } from "@/lib/provider-apply/policy-extract";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Policy text is required." }, { status: 400 });
  }

  const result = await extractAcceptancePolicy(text.slice(0, 200_000));
  return NextResponse.json(result);
}
