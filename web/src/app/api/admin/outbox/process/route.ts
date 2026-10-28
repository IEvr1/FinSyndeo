import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { assertAdmin, loadAuthContext, PermissionError } from "@/lib/permissions";
import { processOutboxBatch } from "@/lib/services/outbox";

export async function POST() {
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

  const result = await processOutboxBatch(50);
  return NextResponse.json(result);
}
