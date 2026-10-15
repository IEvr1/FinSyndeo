import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";

function prefKey(providerId: string) {
  return `provider_reporting:${providerId}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");
  const membership = ctx.memberships.find((m) => m.role === "provider");
  if (!membership?.providerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ periods: ["Monthly"], scheduled: true, email: user.email, reportingEnabled: true });
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.key, prefKey(membership.providerId)))
    .limit(1);

  const value = (row?.value as Record<string, unknown>) ?? {};
  return NextResponse.json({
    reportingEnabled: value.reportingEnabled !== false,
    periods: (value.periods as string[]) ?? ["Monthly"],
    scheduled: value.scheduled !== false,
    email: (value.email as string) ?? user.email,
    nextDelivery: value.nextDelivery ?? null,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");
  const membership = ctx.memberships.find((m) => m.role === "provider");
  if (!membership?.providerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const payload = {
    periods: body.periods ?? ["Monthly"],
    scheduled: body.scheduled !== false,
    email: body.email ?? user.email,
    reportingEnabled: true,
    nextDelivery: body.nextDelivery ?? null,
    updatedAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ saved: true, ...payload });
  }

  const db = getDb();
  const key = prefKey(membership.providerId);
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
