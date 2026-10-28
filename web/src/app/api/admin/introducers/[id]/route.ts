import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { assertAdmin, loadAuthContext, PermissionError } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { writeAudit } from "@/lib/services/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const body = await request.json();
  const patch: Partial<{ status: string; linkSuspended: boolean }> = {};
  if (typeof body.status === "string") patch.status = body.status;
  if (typeof body.linkSuspended === "boolean") patch.linkSuspended = body.linkSuspended;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(schema.introducers)
    .set(patch)
    .where(eq(schema.introducers.id, id))
    .returning();

  await writeAudit({
    actorUserId: user.id,
    action: "introducer.updated",
    resourceType: "introducer",
    resourceId: id,
    metadata: patch,
  });

  return NextResponse.json({ introducer: updated });
}
