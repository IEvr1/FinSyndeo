import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { getApplicationForOwner } from "@/lib/services/applications";

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
    const app = await getApplicationForOwner(id, user.id);
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let revision = null;
    if (app.currentRevisionId) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(schema.assessmentRevisions)
        .where(eq(schema.assessmentRevisions.id, app.currentRevisionId))
        .limit(1);
      revision = row ?? null;
    }

    return NextResponse.json({ application: app, revision });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
