import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";
import { PENDING_REFERRAL_COOKIE } from "@/lib/referrals/constants";
import { createApplicationForUser } from "@/lib/services/application-create";
import { ReferralError } from "@/lib/services/referrals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");
  const db = getDb();
  const apps = await db
    .select({
      id: schema.applications.id,
      route: schema.applications.route,
      status: schema.applications.status,
      updatedAt: schema.applications.updatedAt,
      clientId: schema.applications.clientId,
      introducerId: schema.canonicalClients.introducerId,
      introducerName: schema.introducers.displayName,
    })
    .from(schema.applications)
    .leftJoin(schema.canonicalClients, eq(schema.applications.clientId, schema.canonicalClients.id))
    .leftJoin(schema.introducers, eq(schema.canonicalClients.introducerId, schema.introducers.id))
    .where(eq(schema.applications.ownerUserId, user.id));
  return NextResponse.json({ applications: apps });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "applicant");

  const body = await request.json();
  const { route, typedData, referralToken: bodyToken } = body;
  const jar = await cookies();
  const referralToken =
    (typeof bodyToken === "string" ? bodyToken : null) ?? jar.get(PENDING_REFERRAL_COOKIE)?.value ?? null;

  try {
    const { application, revision } = await createApplicationForUser({
      ownerUserId: user.id,
      ownerEmail: user.email,
      route: route ?? "bank",
      typedData: typedData ?? {},
      submittedByUserId: user.id,
      referralToken,
    });

    if (referralToken) {
      jar.delete(PENDING_REFERRAL_COOKIE);
    }

    return NextResponse.json({ application, revision });
  } catch (e) {
    if (e instanceof ReferralError) {
      const status = e.code === "REFERRAL_CONFLICT" ? 409 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
