import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, assertAdmin } from "@/lib/permissions";
import { ingestOfficialSources, OFFICIAL_SOURCES } from "@/lib/screening";
import { getDb, schema } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  assertAdmin(ctx);

  const results = await ingestOfficialSources();
  const db = getDb();

  for (const r of results) {
    const source = OFFICIAL_SOURCES.find((s) => s.key === r.key);
    await db
      .insert(schema.screeningSources)
      .values({
        sourceKey: r.key,
        sourceUrl: source?.url ?? "",
        version: r.version,
        retrievedAt: r.status === "retrieved" ? new Date() : null,
        status: r.status,
        errorMessage: r.error,
        maxAgeHours: source?.maxAgeHours ?? 24,
      })
      .onConflictDoUpdate({
        target: schema.screeningSources.sourceKey,
        set: {
          version: r.version,
          retrievedAt: r.status === "retrieved" ? new Date() : null,
          status: r.status,
          errorMessage: r.error,
        },
      });
  }

  return NextResponse.json({ results });
}
