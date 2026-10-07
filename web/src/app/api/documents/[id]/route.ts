import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, canAccessDocument } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  const { id } = await params;

  const db = getDb();
  const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (
    !canAccessDocument(ctx, doc.classification, doc.ownerType, doc.ownerId) ||
    doc.classification === "internal_dd_report" && !ctx.memberships.some((m) => m.role === "admin")
  ) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  if (doc.classification === "internal_dd_report" && ctx.memberships.some((m) => m.role === "provider")) {
    return NextResponse.json({ error: "Confidential report not available to providers." }, { status: 403 });
  }

  return NextResponse.json({
    id: doc.id,
    classification: doc.classification,
    fileName: doc.fileName,
    storageKey: doc.storageKey,
  });
}
