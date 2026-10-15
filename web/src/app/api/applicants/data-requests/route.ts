import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ requests: [] });

  const db = getDb();
  const requests = await db
    .select()
    .from(schema.privacyDataRequests)
    .where(eq(schema.privacyDataRequests.userId, user.id));

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const requestType = String(body.type ?? "");
  const allowed = [
    "export_personal_data",
    "correct_personal_data",
    "delete_personal_data",
    "close_sign_in",
    "download_my_information",
  ];
  if (!allowed.includes(requestType)) {
    return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
  }

  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ submitted: true, status: "pending", id: "local" });
  }

  const db = getDb();
  const [row] = await db
    .insert(schema.privacyDataRequests)
    .values({
      userId: user.id,
      providerId: null,
      requestType,
      status: "pending",
      payload: body.payload ?? {},
    })
    .returning();

  return NextResponse.json({ submitted: true, status: row.status, id: row.id });
}
