import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  requireRole(ctx, "provider");

  const membership = ctx.memberships.find((m) => m.role === "provider");
  if (!membership?.providerId) {
    return NextResponse.json({ error: "No provider membership." }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ cases: [], reports: [] });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const serviceFilter = url.searchParams.get("service");
  const q = url.searchParams.get("q")?.toLowerCase();

  const db = getDb();
  const rows = await db
    .select({
      id: schema.introductionRequests.id,
      status: schema.introductionRequests.status,
      createdAt: schema.introductionRequests.createdAt,
      releasedAt: schema.introductionRequests.releasedAt,
      applicationId: schema.applications.id,
      route: schema.applications.route,
      clientName: schema.canonicalClients.displayName,
      sharingApprovalId: schema.introductionRequests.sharingApprovalId,
    })
    .from(schema.introductionRequests)
    .innerJoin(schema.applications, eq(schema.introductionRequests.applicationId, schema.applications.id))
    .innerJoin(schema.canonicalClients, eq(schema.applications.clientId, schema.canonicalClients.id))
    .where(eq(schema.introductionRequests.providerId, membership.providerId))
    .orderBy(desc(schema.introductionRequests.createdAt));

  let cases = rows.map((r) => ({
    reference: r.id.slice(0, 8).toUpperCase(),
    id: r.id,
    applicationId: r.applicationId,
    applicantName: r.sharingApprovalId || r.releasedAt ? r.clientName : null,
    service: r.route,
    introductionDate: r.createdAt,
    status: r.status,
    canViewProfile: Boolean(r.sharingApprovalId && r.releasedAt),
  }));

  if (statusFilter) cases = cases.filter((c) => c.status === statusFilter);
  if (serviceFilter) cases = cases.filter((c) => c.service === serviceFilter);
  if (q) {
    cases = cases.filter(
      (c) =>
        c.reference.toLowerCase().includes(q) ||
        (c.applicantName?.toLowerCase().includes(q) ?? false) ||
        c.service.toLowerCase().includes(q)
    );
  }

  const reports = await db
    .select()
    .from(schema.providerReportSnapshots)
    .where(eq(schema.providerReportSnapshots.providerId, membership.providerId))
    .orderBy(desc(schema.providerReportSnapshots.generatedAt));

  return NextResponse.json({
    cases,
    reports: reports.map((r) => ({
      id: r.id,
      period: r.periodLabel,
      generatedAt: r.generatedAt,
      format: r.format,
    })),
  });
}
