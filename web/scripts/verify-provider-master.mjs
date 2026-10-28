/**
 * Verification against 01 Provider Master Final Aligned.docx
 * Commands: P01–P35, PF01–PF06, PC01–PC06 (M01–M12 matching contract noted separately).
 * Run: node scripts/verify-provider-master.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function read(rel) {
  const p = join(src, rel);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf8");
}

function has(rel, ...patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? text.includes(p) : p.test(text)));
}

function missing(rel, ...patterns) {
  const text = read(rel);
  return patterns.every((p) => !(typeof p === "string" ? text.includes(p) : p.test(text)));
}

/** @type {Array<{id:string,name:string,status:'implemented'|'partial'|'not'|'meta',notes:string}>} */
const commands = [];

function add(id, name, checks, meta = false) {
  if (meta) {
    commands.push({ id, name, status: "meta", notes: "Evidence / process command — see report" });
    return;
  }
  const results = checks.map((c) => ({ ...c, ok: Boolean(c.ok) }));
  const okCount = results.filter((r) => r.ok).length;
  let status = "not";
  if (okCount === results.length) status = "implemented";
  else if (okCount > 0) status = "partial";
  const failed = results.filter((r) => !r.ok).map((r) => r.label);
  commands.push({
    id,
    name,
    status,
    notes: failed.length ? `Missing: ${failed.join("; ")}` : "Core static checks passed",
  });
}

add("P01", "Platform country exclusions and clean catalogue", [
  { label: "Caribbean removed from countries.json", ok: missing("data/countries.json", '"Caribbean"') },
  { label: "World removed from countries.json", ok: missing("data/countries.json", '"World"') },
  { label: "non-country filter in country-policy", ok: has("lib/country-policy/index.ts", "Caribbean", "World") },
  { label: "jurisdiction not-listed message", ok: has("components/provider-apply/ProviderApplyContent.tsx", "FinSyndeo cannot currently accept a provider from that jurisdiction") },
  { label: "server validateCountrySelection", ok: has("app/api/providers/profile/draft/route.ts", "validateCountrySelection") },
  { label: "exclusionPolicyVersion", ok: has("lib/provider-apply/validation.ts", "exclusionPolicyVersion") },
]);

add("P02", "Referral agreement mandatory / verified gate", [
  { label: "agreement required in validation", ok: has("lib/provider-apply/validation.ts", "Referral agreement status") },
  { label: "isAgreementVerified", ok: has("lib/provider-apply/validation.ts", "isAgreementVerified") },
  { label: "self-declared is not verification copy", ok: has("lib/provider-apply/validation.ts", "Self-declared") },
  {
    label: "submit blocks without verification",
    ok: has("lib/provider-apply/validation.ts", "agreementSubmissionErrors"),
  },
  { label: "server submit requires verification", ok: has("app/api/providers/profile/draft/route.ts", "agreementSigned") },
  { label: "verification status UI", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Verification status") },
]);

add("P03", "Simplify authorisation; scope optional", [
  { label: "holder name field removed", ok: missing("components/provider-apply/ProviderApplyContent.tsx", "Legal name of licence / registration holder") },
  { label: "licence reference field removed", ok: missing("components/provider-apply/ProviderApplyContent.tsx", "Licence / registration / notification reference") },
  { label: "licence type field", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Licence / registration type") },
  { label: "scope optional label", ok: has("components/provider-apply/ProviderApplyContent.tsx", "authorisation scope (optional)") },
  { label: "scope not required in validation", ok: missing("lib/provider-apply/validation.ts", "permitted activities") },
  { label: "reference not required in validation", ok: missing("lib/provider-apply/validation.ts", "reference number") },
]);

add("P04", "Add Banking as a Service", [
  { label: "BaaS in correspondent services", ok: has("lib/provider-apply/config.ts", "Banking as a Service (BaaS)") },
  { label: "BaaS description", ok: has("lib/provider-apply/config.ts", "BAAS_DESCRIPTION") },
  { label: "BaaS UI notice", ok: has("components/provider-apply/product-offer-fields.tsx", "Banking as a Service (BaaS)") },
]);

add("P05", "One shared industry/activity policy", [
  { label: "shared industries core", ok: has("components/provider-apply/ProviderApplyContent.tsx", "sharedIndustries") },
  { label: "Accepted/Restricted/Prohibited labels", ok: has("lib/provider-apply/config.ts", "Accepted", "Restricted / conditional", "Prohibited") },
  { label: "single Industry matrix title", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Industry and activity acceptance") },
]);

add("P06", "One country policy upload or manual", [
  { label: "shared geo", ok: has("components/provider-apply/ProviderApplyContent.tsx", "sharedGeo") },
  { label: "one country section", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Country acceptance policy") },
  { label: "completeness confirmation", ok: has("components/provider-apply/ProviderApplyContent.tsx", "completeness and scope") },
]);

add("P07", "Common onboarding and limits once", [
  { label: "step label Payments & onboarding", ok: has("lib/provider-apply/config.ts", "Payments & onboarding") },
  { label: "heading Payments, limits & onboarding", ok: has("lib/provider-apply/config.ts", "Payments, limits & onboarding") },
  { label: "shared onboarding methods", ok: has("components/provider-apply/ProviderApplyContent.tsx", "sharedOnboardingMethods") },
  { label: "no-family Products link", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Select your services in") },
]);

add("P08", "Currencies vs payment routes", [
  { label: "PAYMENT_ROUTES catalogue", ok: has("lib/provider-apply/config.ts", "eur_sepa_instant", "eur_target", "gbp_fps", "usd_fedwire") },
  { label: "payment route matrix UI", ok: has("components/provider-apply/ProviderApplyContent.tsx", "paymentRoutes") },
  { label: "no auto-tick copy", ok: has("components/provider-apply/ProviderApplyContent.tsx", "does not tick routes") },
]);

add("P09", "Provider pre-approval form", [
  { label: "upload or link", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Upload the form", "authorised form link") },
  { label: "validation requires file or link", ok: has("lib/provider-apply/validation.ts", "preApprovalFormLink") },
  { label: "preview without applicant data", ok: has("components/provider-apply/ProviderApplyContent.tsx", "no applicant data") },
]);

add("P10", "Checkbox and label spacing", [
  { label: "checks label gap CSS", ok: has("app/globals.css", ".checks label") || has("app/globals.css", ".checkline") },
  { label: "confirm-line on policy", ok: has("components/provider-apply/ProviderApplyContent.tsx", "confirm-line") },
]);

add("P11", "Review and migration shared policy", [
  { label: "review shows shared policy", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Shared country and industry policy") },
  { label: "soft-toggle preserves drafts", ok: has("lib/provider-apply/state.ts", "Soft-toggle") || has("lib/provider-apply/state.ts", "active: false") },
  { label: "agreement on review", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Referral agreement") },
]);

add("P12", "Privacy Notice and retention links", [
  { label: "privacy link /legal/privacy", ok: has("app/provider/privacy/page.tsx", "/legal/privacy") },
  { label: "retention link /legal/retention", ok: has("app/provider/privacy/page.tsx", "/legal/retention") },
  { label: "self-link removed", ok: missing("app/provider/privacy/page.tsx", 'href="/provider/privacy"') },
]);

add("P13", "Scheduled and ad hoc report controls", [
  { label: "next delivery UI", ok: has("app/provider/preferences/page.tsx", "Next scheduled delivery") },
  { label: "ad hoc range", ok: has("app/provider/preferences/page.tsx", "adHocFrom") },
  { label: "client from≤to validation", ok: has("app/provider/preferences/page.tsx", "from date must be on or before") },
  { label: "server from≤to validation", ok: has("app/api/providers/reporting-preferences/route.ts", "from date must be on or before") },
]);

add("P14", "Policy extraction advertised formats", [
  { label: "extract API", ok: has("app/api/providers/policy/extract/route.ts", "extractAcceptancePolicy") },
  { label: "confirm before publish", ok: has("components/provider-apply/ProviderApplyContent.tsx", "acceptancePolicyConfirmed") },
  {
    label: "binary Word/PDF/Excel parsing",
    ok: has("lib/provider-apply/policy-extract.ts", "docx") || has("lib/provider-apply/policy-extract.ts", "pdf"),
  },
]);

add("P15", "Report download PDF/Excel", [
  { label: "format field", ok: has("app/api/providers/cases/route.ts", "pdf") || has("app/provider/reports/page.tsx", "pdf") || has("app/provider/reports/page.tsx", "PDF") },
  { label: "actual PDF/Excel download endpoint", ok: has("app/api/providers/cases/route.ts", "application/pdf") || has("app/api/providers/cases/route.ts", "xlsx") },
]);

add("P16", "Referral attribution and urgent release", [
  { label: "attribution options", ok: has("lib/provider-apply/config.ts", "REFERRAL_ATTRIBUTION") },
  { label: "release gate", ok: has("lib/release-gate/index.ts", "evaluateReleaseGate") || existsSync(join(src, "lib/release-gate/index.ts")) },
  { label: "urgent release wired to all routes", ok: false },
]);

add("P17", "Command-by-command completion evidence", [], true);

add("P18", "Operating and dedicated client-funds accounts", [
  { label: "operating accounts in bank services", ok: has("lib/provider-apply/config.ts", "Operating / commercial bank accounts") },
  { label: "dedicated client-funds in bank services", ok: has("lib/provider-apply/config.ts", "Dedicated client-funds / safeguarding accounts") },
  { label: "separation hint in UI", ok: has("components/provider-apply/product-offer-fields.tsx", "not implied by") },
]);

add("P19", "Scope client-funds acceptance", [
  { label: "bank client-funds selectable", ok: has("lib/provider-apply/config.ts", "Dedicated client-funds / safeguarding accounts") },
  { label: "per-offering conditions UI", ok: false },
]);

add("P20", "Currency/methods/limits per account offering", [
  { label: "payment route applicability", ok: has("components/provider-apply/ProviderApplyContent.tsx", "paymentRouteApplicability") },
  { label: "per-offering nested limits", ok: false },
]);

add("P21", "Match every requested account; partial coverage", [
  { label: "matcher evaluate exists", ok: existsSync(join(src, "lib/matching")) || existsSync(join(root, "tests/matching.test.ts")) },
  { label: "account-type match for operating vs client-funds", ok: false },
]);

add("P22", "Priorities funding estimate meanings", [
  { label: "matcher priority levels", ok: read("lib/matching/legacy/matching-engine.js").includes("req(") || read("lib/matching").length > 0 },
  { label: "full priority/funding capture for bank", ok: false },
]);

add("P23", "Legal structures per offering", [
  { label: "shared entities matrix", ok: has("components/provider-apply/ProviderApplyContent.tsx", "sharedEntities") },
  { label: "per bank-offering entity scope", ok: false },
]);

add("P24", "Publish migrate cross-route tests", [
  { label: "draft revisions", ok: has("app/api/providers/profile/draft/route.ts", "providerOfferRevisions") },
  { label: "cross-route account-type tests", ok: false },
]);

add("P25", "Merchant channels methods integrations", [
  { label: "merchant services", ok: has("lib/provider-apply/config.ts", "Online card payments", "In-person card payments") },
  { label: "crypto section", ok: has("components/provider-apply/product-offer-fields.tsx", "Crypto-related payment services") },
  { label: "schemes/APMs/gateways UI", ok: false },
]);

add("P26", "Customer market and transaction size", [
  { label: "processing volume fields", ok: has("components/provider-apply/product-terms-fields.tsx", "minProcessing") },
  { label: "ticket/volume currency capture", ok: false },
]);

add("P27", "Merchant history fraud chargeback", [
  { label: "provider chargeback/fraud UI", ok: false },
]);

add("P28", "Settlement routes and crypto explicit", [
  { label: "crypto services", ok: has("lib/provider-apply/config.ts", "MERCHANT_CRYPTO_SERVICES") },
  { label: "settlement currencies/account UI", ok: false },
]);

add("P29", "Combined merchant and bank matching", [
  { label: "both route in matcher", ok: read("lib/matching/legacy/matching-engine.js").includes('"both"') || read("lib/matching/legacy/matching-engine.js").includes("both") },
  { label: "MB06 combined tests", ok: false },
]);

add("P30", "Merchant currency and priority exceptions", [
  { label: "merchant currencies", ok: has("lib/provider-apply/config.ts", "Payment acceptance") || has("components/provider-apply/product-offer-fields.tsx", "currencies") },
  { label: "merchant vs bank priority exception UI", ok: false },
]);

add("P31", "Merchant legal structures and settlement scope", [
  { label: "entity types", ok: has("lib/provider-apply/config.ts", "ENTITY_TYPES") || has("lib/provider-apply/config.ts", "Association") },
  { label: "settlement account conditions UI", ok: false },
]);

add("P32", "Preserve shared policies during merchant updates", [
  { label: "soft family toggle", ok: has("lib/provider-apply/state.ts", "toggleProductFamily") },
  { label: "shared policy sync guard", ok: has("components/provider-apply/ProviderApplyContent.tsx", "sharedIndustries") },
]);

add("P33", "Merchant and combined acceptance evidence", [], true);

add("P34", "Private banking additional capability capture", [
  { label: "custody/advice/managed distinct", ok: has("lib/provider-apply/config.ts", "Securities custody", "Investment advisory", "Discretionary portfolio management") },
]);

add("P35", "Conditions and matching explanations", [
  { label: "additional conditions field", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Specific conditions or exceptions") },
  { label: "full evaluation evidence UI", ok: false },
]);

add("PF01", "Maritime and project finance explicit", [
  { label: "project finance", ok: has("lib/provider-apply/config.ts", "Project finance") },
  { label: "maritime / vessel finance", ok: has("lib/provider-apply/config.ts", "Maritime / vessel finance") },
]);

add("PF02", "Financing criteria and units", [
  { label: "finance terms UI amount/term/units", ok: false },
]);

add("PF03", "Borrower and financial availability", [
  { label: "audit/borrower provider UI", ok: false },
]);

add("PF04", "Borrowing and security matching", [
  { label: "security types provider UI", ok: false },
]);

add("PF05", "Exclude financing cross-service preferences", [
  { label: "finance family scoped services", ok: has("lib/provider-apply/config.ts", '"finance":') },
  { label: "explicit cross-service exclusion rule", ok: false },
]);

add("PF06", "Publish migrate test financing", [
  { label: "draft publish path", ok: has("app/api/providers/profile/draft/route.ts", "submitForReview") },
  { label: "maritime matching tests", ok: false },
]);

add("PC01", "Correspondent product catalogue", [
  { label: "correspondent services", ok: has("lib/provider-apply/config.ts", "Operational accounts — institution's own funds") },
  { label: "BaaS in catalogue", ok: has("lib/provider-apply/config.ts", "Banking as a Service (BaaS)") },
]);

add("PC02", "Account structures and client funds", [
  { label: "clientFundsScope UI", ok: has("components/provider-apply/product-offer-fields.tsx", "clientFundsScope") },
  { label: "fundHoldingStructure", ok: has("components/provider-apply/product-offer-fields.tsx", "fundHoldingStructure") },
]);

add("PC03", "New services separate permissions", [
  { label: "on/off ramp merchant", ok: has("lib/provider-apply/config.ts", "on-ramp", "off-ramp") },
  { label: "correspondent issuing/BaaS permissions", ok: has("lib/provider-apply/config.ts", "Banking as a Service (BaaS)") },
]);

add("PC04", "Currencies rails and flow limits", [
  { label: "shared payment routes", ok: has("lib/provider-apply/config.ts", "PAYMENT_ROUTES") },
  { label: "correspondent-specific rails UI", ok: has("components/provider-apply/ProviderApplyContent.tsx", "paymentRoutes") },
]);

add("PC05", "Eligibility regulatory compliance", [
  { label: "shared geo/industries", ok: has("components/provider-apply/ProviderApplyContent.tsx", "sharedGeo") },
  { label: "MSB/CASP compliance UI", ok: false },
]);

add("PC06", "Review publication matching evidence", [
  { label: "review cards", ok: has("components/provider-apply/ProviderApplyContent.tsx", "review-card") },
  { label: "publication matching evidence suite", ok: false },
]);

const implemented = commands.filter((c) => c.status === "implemented");
const partial = commands.filter((c) => c.status === "partial");
const notImpl = commands.filter((c) => c.status === "not");
const meta = commands.filter((c) => c.status === "meta");

console.log("FinSyndeo Provider Master Final Aligned — verification report\n");
console.log(`Deployed revision check date: ${new Date().toISOString().slice(0, 10)}`);
console.log(`Source: 01 Provider Master Final Aligned.docx\n`);

for (const c of commands) {
  const tag =
    c.status === "implemented" ? "OK  " : c.status === "partial" ? "PART" : c.status === "meta" ? "META" : "NO  ";
  console.log(`${tag}  ${c.id.padEnd(4)}  ${c.name}`);
  if (c.status !== "implemented" && c.status !== "meta") console.log(`      ${c.notes}`);
}

console.log("\n--- Matching contract M01–M12 ---");
console.log("META  M01–M12  Shared matching predicates — largely engine-side; capture gaps listed under P/PF/PC.");
console.log("      Full end-to-end acceptance for every M rule is Not tested in this static pass.");

console.log("\n--- Summary ---");
console.log(`Total change commands (P/PF/PC): ${commands.length}`);
console.log(`Implemented (static checks): ${implemented.length}`);
console.log(`Partial: ${partial.length}`);
console.log(`Not implemented: ${notImpl.length}`);
console.log(`Meta / evidence: ${meta.length}`);
console.log(`\nImplemented IDs: ${implemented.map((c) => c.id).join(", ") || "(none)"}`);
console.log(`Partial IDs: ${partial.map((c) => c.id).join(", ") || "(none)"}`);
console.log(`Not implemented IDs: ${notImpl.map((c) => c.id).join(", ") || "(none)"}`);
