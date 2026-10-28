import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const src = path.join(root, "src");

function read(rel) {
  return fs.readFileSync(path.join(src, rel), "utf8");
}

function has(rel, needle) {
  return read(rel).includes(needle);
}

const checks = [
  ["schema linkSuspended", has("lib/db/schema.ts", "linkSuspended")],
  ["schema provider_relationships", has("lib/db/schema.ts", "providerRelationships")],
  ["referrals isLinkActive", has("lib/services/referrals.ts", "isLinkActive")],
  ["referral landing route", fs.existsSync(path.join(src, "app/apply/ref/[token]/page.tsx"))],
  ["applications bind referral", has("app/api/applications/route.ts", "createApplicationForUser")],
  ["on-behalf API", fs.existsSync(path.join(src, "app/api/introducers/me/referrals/on-behalf/route.ts"))],
  ["applicant confirmation API", fs.existsSync(path.join(src, "app/api/referrals/[applicationId]/applicant-confirmation/route.ts"))],
  ["agreement accept API", fs.existsSync(path.join(src, "app/api/agreements/[id]/acceptance/route.ts"))],
  ["postProviderReceipt", has("lib/services/commissions.ts", "postProviderReceipt")],
  ["relationships service", has("lib/services/relationships.ts", "setRelationshipStatus")],
  ["outbox process route", fs.existsSync(path.join(src, "app/api/admin/outbox/process/route.ts"))],
  ["E07 enqueue on-behalf", has("app/api/introducers/me/referrals/on-behalf/route.ts", 'templateId: "E07"')],
  ["migration file", fs.existsSync(path.join(root, "drizzle/0001_introducer_referral.sql"))],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(ok ? "OK" : "FAIL", name);
  if (!ok) failed++;
}

if (failed > 0) {
  process.exit(1);
}

console.log(`All ${checks.length} introducer referral checks passed.`);
