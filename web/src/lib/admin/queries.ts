import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const LIST_LIMIT = 100;

async function withDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export type AdminOverviewMetrics = {
  applications: number;
  clients: number;
  providers: number;
  introductionRequests: number;
  openOutbox: number;
  privacyRequests: number;
};

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  return withDb(async () => {
    const db = getDb();
    const [applications, clients, providers, introductionRequests, openOutbox, privacyRequests] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(schema.applications),
        db.select({ count: sql<number>`count(*)::int` }).from(schema.canonicalClients),
        db.select({ count: sql<number>`count(*)::int` }).from(schema.providers),
        db.select({ count: sql<number>`count(*)::int` }).from(schema.introductionRequests),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.outboxEvents)
          .where(eq(schema.outboxEvents.state, "pending")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.privacyDataRequests)
          .where(eq(schema.privacyDataRequests.status, "pending")),
      ]);
    return {
      applications: applications[0]?.count ?? 0,
      clients: clients[0]?.count ?? 0,
      providers: providers[0]?.count ?? 0,
      introductionRequests: introductionRequests[0]?.count ?? 0,
      openOutbox: openOutbox[0]?.count ?? 0,
      privacyRequests: privacyRequests[0]?.count ?? 0,
    };
  }, {
    applications: 0,
    clients: 0,
    providers: 0,
    introductionRequests: 0,
    openOutbox: 0,
    privacyRequests: 0,
  });
}

export async function listApplications() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.applications.id,
        route: schema.applications.route,
        status: schema.applications.status,
        updatedAt: schema.applications.updatedAt,
        clientId: schema.applications.clientId,
        displayName: schema.canonicalClients.displayName,
      })
      .from(schema.applications)
      .leftJoin(schema.canonicalClients, eq(schema.applications.clientId, schema.canonicalClients.id))
      .orderBy(desc(schema.applications.updatedAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listDocumentsInternal() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select()
      .from(schema.documents)
      .orderBy(desc(schema.documents.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listProviders() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select()
      .from(schema.providers)
      .orderBy(desc(schema.providers.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listProviderOfferRevisions() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.providerOfferRevisions.id,
        providerId: schema.providerOfferRevisions.providerId,
        revisionNumber: schema.providerOfferRevisions.revisionNumber,
        approvalStatus: schema.providerOfferRevisions.approvalStatus,
        publishedAt: schema.providerOfferRevisions.publishedAt,
        legalName: schema.providers.legalName,
      })
      .from(schema.providerOfferRevisions)
      .leftJoin(schema.providers, eq(schema.providerOfferRevisions.providerId, schema.providers.id))
      .orderBy(desc(schema.providerOfferRevisions.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listProviderPlannedItems() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.providerPlannedItems.id,
        itemName: schema.providerPlannedItems.itemName,
        offerFamily: schema.providerPlannedItems.offerFamily,
        status: schema.providerPlannedItems.status,
        launchTarget: schema.providerPlannedItems.launchTarget,
        legalName: schema.providers.legalName,
      })
      .from(schema.providerPlannedItems)
      .leftJoin(schema.providers, eq(schema.providerPlannedItems.providerId, schema.providers.id))
      .orderBy(desc(schema.providerPlannedItems.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listProviderReportSnapshots() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.providerReportSnapshots.id,
        periodLabel: schema.providerReportSnapshots.periodLabel,
        format: schema.providerReportSnapshots.format,
        generatedAt: schema.providerReportSnapshots.generatedAt,
        legalName: schema.providers.legalName,
      })
      .from(schema.providerReportSnapshots)
      .leftJoin(schema.providers, eq(schema.providerReportSnapshots.providerId, schema.providers.id))
      .orderBy(desc(schema.providerReportSnapshots.generatedAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listCanonicalClients() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select()
      .from(schema.canonicalClients)
      .orderBy(desc(schema.canonicalClients.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listIntroducers() {
  return withDb(async () => {
    const db = getDb();
    return db.select().from(schema.introducers).orderBy(desc(schema.introducers.createdAt)).limit(LIST_LIMIT);
  }, []);
}

export async function listAgreements() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.agreements.id,
        agreementType: schema.agreements.agreementType,
        version: schema.agreements.version,
        status: schema.agreements.status,
        acceptedAt: schema.agreements.acceptedAt,
        displayName: schema.introducers.displayName,
      })
      .from(schema.agreements)
      .leftJoin(schema.introducers, eq(schema.agreements.introducerId, schema.introducers.id))
      .orderBy(desc(schema.agreements.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listCommissionEntries() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.commissionEntries.id,
        grossMinor: schema.commissionEntries.grossMinor,
        shareMinor: schema.commissionEntries.shareMinor,
        currency: schema.commissionEntries.currency,
        ratePercent: schema.commissionEntries.ratePercent,
        postedAt: schema.commissionEntries.postedAt,
        introducerName: schema.introducers.displayName,
        clientName: schema.canonicalClients.displayName,
      })
      .from(schema.commissionEntries)
      .leftJoin(schema.introducers, eq(schema.commissionEntries.introducerId, schema.introducers.id))
      .leftJoin(schema.canonicalClients, eq(schema.commissionEntries.clientId, schema.canonicalClients.id))
      .orderBy(desc(schema.commissionEntries.postedAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listPayments() {
  return withDb(async () => {
    const db = getDb();
    return db.select().from(schema.payments).orderBy(desc(schema.payments.createdAt)).limit(LIST_LIMIT);
  }, []);
}

export async function listIntroductionRequests() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.introductionRequests.id,
        status: schema.introductionRequests.status,
        entitlementType: schema.introductionRequests.entitlementType,
        paymentStatus: schema.introductionRequests.paymentStatus,
        releasedAt: schema.introductionRequests.releasedAt,
        createdAt: schema.introductionRequests.createdAt,
        legalName: schema.providers.legalName,
      })
      .from(schema.introductionRequests)
      .leftJoin(schema.providers, eq(schema.introductionRequests.providerId, schema.providers.id))
      .orderBy(desc(schema.introductionRequests.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listSharingApprovals() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select({
        id: schema.sharingApprovals.id,
        institutionLegalName: schema.sharingApprovals.institutionLegalName,
        recipientEmail: schema.sharingApprovals.recipientEmail,
        purpose: schema.sharingApprovals.purpose,
        approvedAt: schema.sharingApprovals.approvedAt,
        withdrawnAt: schema.sharingApprovals.withdrawnAt,
      })
      .from(schema.sharingApprovals)
      .orderBy(desc(schema.sharingApprovals.approvedAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listUsersWithMemberships() {
  return withDb(async () => {
    const db = getDb();
    const users = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt)).limit(LIST_LIMIT);
    const memberships = await db.select().from(schema.memberships);
    return users.map((u) => ({
      ...u,
      roles: memberships.filter((m) => m.userId === u.id && m.active).map((m) => m.role),
    }));
  }, []);
}

export async function listScreeningSources() {
  return withDb(async () => {
    const db = getDb();
    return db.select().from(schema.screeningSources).orderBy(desc(schema.screeningSources.retrievedAt)).limit(LIST_LIMIT);
  }, []);
}

export async function listScreeningRuns() {
  return withDb(async () => {
    const db = getDb();
    return db.select().from(schema.screeningRuns).orderBy(desc(schema.screeningRuns.createdAt)).limit(LIST_LIMIT);
  }, []);
}

export async function listPrivacyRequests() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select()
      .from(schema.privacyDataRequests)
      .orderBy(desc(schema.privacyDataRequests.createdAt))
      .limit(LIST_LIMIT);
  }, []);
}

export async function listOutboxEvents() {
  return withDb(async () => {
    const db = getDb();
    return db.select().from(schema.outboxEvents).orderBy(desc(schema.outboxEvents.createdAt)).limit(LIST_LIMIT);
  }, []);
}

export async function listAuditEvents() {
  return withDb(async () => {
    const db = getDb();
    return db.select().from(schema.auditEvents).orderBy(desc(schema.auditEvents.createdAt)).limit(LIST_LIMIT);
  }, []);
}

export async function listPlatformSettings() {
  return withDb(async () => {
    const db = getDb();
    return db.select().from(schema.platformSettings).orderBy(desc(schema.platformSettings.updatedAt));
  }, []);
}

export async function listCountryPoliciesDb() {
  return withDb(async () => {
    const db = getDb();
    return db
      .select()
      .from(schema.countryPolicies)
      .orderBy(desc(schema.countryPolicies.version))
      .limit(LIST_LIMIT);
  }, []);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatMinor(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100);
}

export function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}
