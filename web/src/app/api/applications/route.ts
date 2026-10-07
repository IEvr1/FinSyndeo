import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");
  const db = getDb();
  const apps = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.ownerUserId, user.id));
  return NextResponse.json({ applications: apps });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");

  const { route, typedData } = await request.json();
  const db = getDb();

  const identityKey = typedData?.applicant?.registration
    ? `entity:${typedData.applicant.jurisdiction}:${typedData.applicant.registration}`
    : `person:${user.email}`;

  let [client] = await db
    .select()
    .from(schema.canonicalClients)
    .where(eq(schema.canonicalClients.identityKey, identityKey))
    .limit(1);

  if (!client) {
    [client] = await db
      .insert(schema.canonicalClients)
      .values({
        identityType: typedData?.applicant?.registration ? "entity" : "person",
        identityKey,
        displayName: typedData?.applicant?.name ?? user.email,
      })
      .returning();
  }

  const [app] = await db
    .insert(schema.applications)
    .values({
      ownerUserId: user.id,
      clientId: client.id,
      route: route ?? "bank",
      status: "draft",
    })
    .returning();

  const hash = createHash("sha256").update(JSON.stringify(typedData ?? {})).digest("hex");
  const [revision] = await db
    .insert(schema.assessmentRevisions)
    .values({
      applicationId: app.id,
      revisionNumber: 1,
      typedData: typedData ?? {},
      contentHash: hash,
    })
    .returning();

  await db
    .update(schema.applications)
    .set({ currentRevisionId: revision.id })
    .where(eq(schema.applications.id, app.id));

  return NextResponse.json({ application: app, revision });
}
