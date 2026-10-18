import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { getApplicationForOwner } from "@/lib/services/applications";

function prefKey(applicationId: string) {
  return `applicant_match_alerts:${applicationId}`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");

  const applicationId = new URL(request.url).searchParams.get("applicationId");
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const app = await getApplicationForOwner(applicationId, user.id);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      enabled: false,
      threshold: 80,
      email: user.email,
    });
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.key, prefKey(applicationId)))
    .limit(1);

  const value = (row?.value as Record<string, unknown>) ?? {};
  return NextResponse.json({
    enabled: value.enabled === true,
    threshold: typeof value.threshold === "number" ? value.threshold : 80,
    email: (value.email as string) ?? user.email,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");

  const body = await request.json();
  const applicationId = String(body.applicationId ?? "");
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const app = await getApplicationForOwner(applicationId, user.id);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const enabled = body.enabled === true;
  const threshold = [70, 80, 90, 100].includes(Number(body.threshold)) ? Number(body.threshold) : 80;
  const payload = {
    enabled,
    threshold,
    email: user.email,
    updatedAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ saved: true, ...payload });
  }

  const db = getDb();
  const key = prefKey(applicationId);
  const [existing] = await db
    .select({ id: schema.platformSettings.id })
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(schema.platformSettings)
      .set({ value: payload, updatedAt: new Date() })
      .where(eq(schema.platformSettings.id, existing.id));
  } else {
    await db.insert(schema.platformSettings).values({ key, value: payload });
  }

  return NextResponse.json({ saved: true, ...payload });
}
