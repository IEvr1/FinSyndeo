import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/db/schema";
import { UNRESOLVED_PARTICULARS } from "../src/lib/unresolved";

async function main() {
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

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
