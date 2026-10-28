import { createHash, randomUUID } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/db/schema";
import { fixtureProfile } from "../src/lib/matching";
import { UNRESOLVED_PARTICULARS } from "../src/lib/unresolved";

const SAMPLE_COUNT = 80;

const JURISDICTIONS = [
  "Cyprus",
  "Greece",
  "Germany",
  "France",
  "Malta",
  "Ireland",
  "Netherlands",
  "Luxembourg",
  "Lithuania",
  "Switzerland",
  "United Kingdom",
  "Austria",
  "Belgium",
  "Spain",
  "Italy",
  "Portugal",
  "Sweden",
  "Denmark",
  "Finland",
  "Estonia",
] as const;

const INSTITUTION_KINDS = [
  "Bank",
  "Private Bank",
  "Payments Institution",
  "Merchant Bank",
  "Credit Institution",
] as const;

const NAME_STEMS = [
  "Harbour",
  "Summit",
  "Orchard",
  "Cedar",
  "River",
  "North",
  "Silver",
  "Amber",
  "Maple",
  "Stone",
  "Linden",
  "Willow",
  "Beacon",
  "Horizon",
  "Atlas",
  "Coral",
] as const;

const INDUSTRIES = [
  "Consulting & professional services",
  "E-commerce & retail",
  "Software, IT & telecommunications",
  "Manufacturing",
  "Holding & investment companies",
] as const;

const CUSTOMER_ROUTES = ["bank", "merchant", "both", "financing", "individual"] as const;

type CustomerRoute = (typeof CUSTOMER_ROUTES)[number];

function loadLocalEnv() {
  if (process.env.DATABASE_URL) return;
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function pad(n: number) {
  return String(n).padStart(3, "0");
}

function jurisdiction(n: number) {
  return JURISDICTIONS[(n - 1) % JURISDICTIONS.length];
}

function institutionCode(n: number) {
  return `SAMPLE-I-${pad(n)}`;
}

function customerKey(n: number) {
  return `sample:customer:${pad(n)}`;
}

function institutionEmail(n: number) {
  return `institution.sample.${pad(n)}@example.test`;
}

function customerEmail(n: number) {
  return `customer.sample.${pad(n)}@example.test`;
}

function institutionName(n: number) {
  const stem = NAME_STEMS[(n - 1) % NAME_STEMS.length];
  const kind = INSTITUTION_KINDS[(n - 1) % INSTITUTION_KINDS.length];
  return `Sample ${stem} ${kind} ${pad(n)}`;
}

function customerName(n: number, route: CustomerRoute) {
  if (route === "individual") return `Sample Person ${pad(n)}`;
  const stem = NAME_STEMS[(n - 1) % NAME_STEMS.length];
  return `Sample ${stem} Trading ${pad(n)} Ltd`;
}

function customerTyped(n: number, route: CustomerRoute) {
  const country = jurisdiction(n);
  const name = customerName(n, route);
  const personal = route === "individual";
  const registration = `SAMPLE-C-${pad(n)}`;
  const industry = INDUSTRIES[(n - 1) % INDUSTRIES.length];
  const amount = 10000 + n * 250;
  const eur = (scope: string) => [{ value: "EUR", level: "essential", key: `${scope}.currency.EUR` }];
  const cap = (scope: string, value: string) => [
    { value, level: "essential", key: `${scope}.capability.${value}` },
  ];

  const requirements: Record<string, unknown> = {};
  if (route === "bank" || route === "both") {
    requirements.bank = {
      capabilities: cap("bank", "operational"),
      currencies: eur("bank"),
      reportCurrency: "EUR",
      incoming: { countries: [country], amount, count: 20 + n },
      outgoing: { countries: [country], amount: Math.round(amount * 0.8), count: 15 + n },
    };
  }
  if (route === "merchant" || route === "both") {
    requirements.merchant = {
      capabilities: cap("merchant", "online"),
      chargeCurrencies: eur("merchant.charge"),
      settlementCurrencies: eur("merchant.settlement"),
      reportCurrency: "EUR",
      monthlyAmount: amount,
      monthlyCount: 40 + n,
      averageTicket: 250,
      maxTicket: 5000,
      historyMonths: 6,
    };
  }
  if (route === "financing") {
    requirements.finance = {
      capabilities: cap("finance", "working_capital"),
      currencies: eur("finance"),
      amount,
      currency: "EUR",
    };
  }
  if (route === "individual") {
    requirements.private = {
      capabilities: cap("private", "personal"),
      currencies: eur("private"),
      placement: 75000 + n * 1000,
      investment: 25000,
      wealthSources: ["employment"],
      fundSources: ["employment"],
      ownFunds: "Yes",
      fundOrigin: [country],
      incoming: [country],
      outgoing: [country],
    };
  }

  return {
    schemaVersion: "2026-10-06.1",
    route,
    applicant: {
      kind: personal ? "individual" : "entity",
      name,
      jurisdiction: country,
      registration: personal ? null : registration,
      entityType: personal ? null : "Private limited company (Ltd / LLC or equivalent)",
      personal: personal
        ? {
            name: "Sample",
            surname: `Person ${pad(n)}`,
            nationalities: [country],
            residence: country,
            taxResidence: [country],
          }
        : null,
      persons: personal
        ? []
        : [
            {
              id: `person-sample-${pad(n)}`,
              fullName: "Alex Example",
              name: "Alex Example",
              sharePercentage: 100,
              percentage: "100",
              controlRoles: ["Beneficial owner"],
              nationalities: [country],
              residence: country,
            },
          ],
      shareholders: [],
      group: personal
        ? null
        : { member: false, name: "", sameInstitution: "", uboPersonal: "No" },
    },
    business: personal
      ? null
      : {
          industry,
          otherIndustry: "",
          activity: `Fictional sample activity for ${name}. Professional services to businesses in ${country}.`,
          website: "https://example.test",
          permissionRequired: false,
          permissions: [],
          office: "Yes",
          employees: "1-10",
          euAgent: null,
        },
    requirements,
    counterparties: [],
    context: {
      contact: {
        name: personal ? name : "Alex Example",
        email: customerEmail(n),
        capacity: personal ? "Account holder" : "Director / officer",
        authority: true,
      },
      legalChecks: "not_connected",
    },
    screeningSubjects: [
      {
        id: "applicant",
        kind: personal ? "individual" : "entity",
        name,
        roles: ["applicant"],
        country,
      },
    ],
  };
}

async function seedSampleInstitutions(db: ReturnType<typeof drizzle<typeof schema>>) {
  const rows = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const n = index + 1;
    return {
      code: institutionCode(n),
      legalName: institutionName(n),
      country: jurisdiction(n),
      email: institutionEmail(n),
      name: `Sample Institution Contact ${pad(n)}`,
      minDeposit: n % 5 === 0 ? 250000 : 50000,
      currencies: n % 4 === 0 ? ["EUR", "GBP", "CHF"] : ["EUR", "GBP", "USD", "CHF"],
    };
  });

  for (const chunk of chunks(rows, 20)) {
    await db
      .insert(schema.providers)
      .values(
        chunk.map((row) => ({
          code: row.code,
          legalName: row.legalName,
          country: row.country,
          approved: true,
          agreementSigned: true,
          active: true,
        }))
      )
      .onConflictDoUpdate({
        target: schema.providers.code,
        set: {
          legalName: sql`excluded.legal_name`,
          country: sql`excluded.country`,
          approved: true,
          agreementSigned: true,
          active: true,
        },
      });
  }

  const refreshed = await db
    .select()
    .from(schema.providers)
    .where(
      inArray(
        schema.providers.code,
        rows.map((row) => row.code)
      )
    );

  for (const chunk of chunks(rows, 20)) {
    await db
      .insert(schema.users)
      .values(
        chunk.map((row) => ({
          email: row.email,
          name: row.name,
          emailVerified: true,
        }))
      )
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { name: sql`excluded.name`, emailVerified: true },
      });
  }

  const users = await db
    .select()
    .from(schema.users)
    .where(
      inArray(
        schema.users.email,
        rows.map((row) => row.email)
      )
    );

  const userIds = users.map((user) => user.id);
  const existingMemberships = userIds.length
    ? await db
        .select()
        .from(schema.memberships)
        .where(inArray(schema.memberships.userId, userIds))
    : [];

  const missingMemberships = rows.flatMap((row) => {
    const user = users.find((item) => item.email === row.email);
    const provider = refreshed.find((item) => item.code === row.code);
    if (!user || !provider) return [];
    const exists = existingMemberships.some(
      (membership) =>
        membership.userId === user.id &&
        membership.role === "provider" &&
        membership.providerId === provider.id
    );
    if (exists) return [];
    return [{ userId: user.id, role: "provider" as const, providerId: provider.id, invited: false, active: true }];
  });

  for (const chunk of chunks(missingMemberships, 20)) {
    if (chunk.length) await db.insert(schema.memberships).values(chunk);
  }

  const providerIds = refreshed.map((provider) => provider.id);
  const existingOffers = providerIds.length
    ? await db
        .select({ providerId: schema.providerOfferRevisions.providerId })
        .from(schema.providerOfferRevisions)
        .where(inArray(schema.providerOfferRevisions.providerId, providerIds))
    : [];
  const offered = new Set(existingOffers.map((offer) => offer.providerId));

  const offerRows = refreshed
    .filter((provider) => !offered.has(provider.id))
    .map((provider) => {
      const row = rows.find((item) => item.code === provider.code)!;
      return {
        providerId: provider.id,
        revisionNumber: 1,
        profileData: fixtureProfile({
          id: provider.id,
          code: provider.code,
          name: provider.legalName,
          country: provider.country,
          exampleCurrencies: row.currencies,
          exampleMinDeposit: row.minDeposit,
        }),
        approvalStatus: "approved_fixture",
        publishedAt: new Date(),
      };
    });

  for (const chunk of chunks(offerRows, 5)) {
    if (chunk.length) await db.insert(schema.providerOfferRevisions).values(chunk);
  }

  return refreshed.length;
}

async function seedSampleCustomers(db: ReturnType<typeof drizzle<typeof schema>>) {
  const rows = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const n = index + 1;
    const route = CUSTOMER_ROUTES[index % CUSTOMER_ROUTES.length];
    return {
      n,
      route,
      email: customerEmail(n),
      name: customerName(n, route),
      identityKey: customerKey(n),
      identityType: route === "individual" ? "person" : "entity",
      typed: customerTyped(n, route),
    };
  });

  for (const chunk of chunks(rows, 20)) {
    await db
      .insert(schema.users)
      .values(chunk.map((row) => ({ email: row.email, name: row.name, emailVerified: true })))
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { name: sql`excluded.name`, emailVerified: true },
      });
  }

  const users = await db
    .select()
    .from(schema.users)
    .where(
      inArray(
        schema.users.email,
        rows.map((row) => row.email)
      )
    );

  for (const chunk of chunks(rows, 20)) {
    await db
      .insert(schema.canonicalClients)
      .values(
        chunk.map((row) => ({
          identityType: row.identityType,
          identityKey: row.identityKey,
          displayName: row.name,
        }))
      )
      .onConflictDoUpdate({
        target: schema.canonicalClients.identityKey,
        set: {
          displayName: sql`excluded.display_name`,
          identityType: sql`excluded.identity_type`,
        },
      });
  }

  const clients = await db
    .select()
    .from(schema.canonicalClients)
    .where(
      inArray(
        schema.canonicalClients.identityKey,
        rows.map((row) => row.identityKey)
      )
    );

  const userIds = users.map((user) => user.id);
  const existingMemberships = userIds.length
    ? await db.select().from(schema.memberships).where(inArray(schema.memberships.userId, userIds))
    : [];

  const missingMemberships = rows.flatMap((row) => {
    const user = users.find((item) => item.email === row.email);
    if (!user) return [];
    const exists = existingMemberships.some(
      (membership) => membership.userId === user.id && membership.role === "applicant"
    );
    if (exists) return [];
    return [{ userId: user.id, role: "applicant" as const, invited: false, active: true }];
  });

  for (const chunk of chunks(missingMemberships, 20)) {
    if (chunk.length) await db.insert(schema.memberships).values(chunk);
  }

  const clientIds = clients.map((client) => client.id);
  const existingApps = clientIds.length
    ? await db
        .select({ clientId: schema.applications.clientId })
        .from(schema.applications)
        .where(inArray(schema.applications.clientId, clientIds))
    : [];
  const haveApp = new Set(existingApps.map((app) => app.clientId));

  const applications = rows.flatMap((row) => {
    const user = users.find((item) => item.email === row.email);
    const client = clients.find((item) => item.identityKey === row.identityKey);
    if (!user || !client || haveApp.has(client.id)) return [];
    const applicationId = randomUUID();
    const revisionId = randomUUID();
    const typed = row.typed;
    return [
      {
        application: {
          id: applicationId,
          ownerUserId: user.id,
          clientId: client.id,
          route: row.route,
          status: "confirmed" as const,
          currentRevisionId: revisionId,
          schemaVersion: "2026-10-06.1",
        },
        revision: {
          id: revisionId,
          applicationId,
          revisionNumber: 1,
          typedData: typed,
          confirmedAt: new Date(),
          confirmedByUserId: user.id,
          contentHash: createHash("sha256").update(JSON.stringify(typed)).digest("hex"),
        },
      },
    ];
  });

  for (const chunk of chunks(applications, 20)) {
    if (!chunk.length) continue;
    await db.insert(schema.applications).values(chunk.map((item) => item.application));
    await db.insert(schema.assessmentRevisions).values(chunk.map((item) => item.revision));
  }

  return clients.length;
}

function chunks<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  loadLocalEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const db = drizzle(neon(url), { schema });

  for (const p of UNRESOLVED_PARTICULARS) {
    await db
      .insert(schema.unresolvedParticulars)
      .values({
        key: p.key,
        category: p.category,
        description: p.description,
        blocksActions: p.blocksActions,
        resolved: p.resolved,
      })
      .onConflictDoUpdate({
        target: schema.unresolvedParticulars.key,
        set: { description: p.description, blocksActions: p.blocksActions, resolved: p.resolved },
      });
  }

  await db
    .insert(schema.platformSettings)
    .values({
      key: "introduction_pricing",
      value: {
        freeEnabled: true,
        initialFree: 3,
        paidEnabled: true,
        feeMinor: 25000,
        currency: "EUR",
        configured: false,
        note: "Prototype demo values — production amount and tax treatment require SOPHIMA configuration.",
      },
    })
    .onConflictDoUpdate({
      target: schema.platformSettings.key,
      set: {
        value: {
          freeEnabled: true,
          initialFree: 3,
          paidEnabled: true,
          feeMinor: 25000,
          currency: "EUR",
          configured: false,
          note: "Prototype demo values — production amount and tax treatment require SOPHIMA configuration.",
        },
      },
    });

  for (const [code, name, country] of [
    ["P14", "Example Bank Ltd", "Cyprus"],
    ["P26", "Sample Private Bank", "Switzerland"],
    ["P33", "Demo Merchant Bank", "Malta"],
  ] as const) {
    await db
      .insert(schema.providers)
      .values({
        code,
        legalName: name,
        country,
        approved: true,
        agreementSigned: true,
        active: true,
      })
      .onConflictDoUpdate({
        target: schema.providers.code,
        set: { legalName: name, country, approved: true, agreementSigned: true, active: true },
      });
  }

  const institutions = await seedSampleInstitutions(db);
  const customers = await seedSampleCustomers(db);

  console.log(`Seed complete. Sample institutions: ${institutions}. Sample customers: ${customers}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
