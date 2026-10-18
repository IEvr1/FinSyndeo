/**
 * Verification against FinSyndeo Changes for Provider_v2.docx (24 Change Commands).
 * Run: node scripts/verify-provider-v2.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function read(rel) {
  return readFileSync(join(src, rel), "utf8");
}

function has(rel, ...patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? text.includes(p) : p.test(text)));
}

function missing(rel, ...patterns) {
  const text = read(rel);
  return patterns.every((p) => !(typeof p === "string" ? text.includes(p) : p.test(text)));
}

/** @type {Array<{id:number,name:string,status:'implemented'|'partial'|'not',notes:string}>} */
const commands = [];

function add(id, name, checks) {
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
    notes: failed.length ? `Missing: ${failed.join("; ")}` : "Core checks passed",
  });
}

add(1, "Authorisation jurisdiction exclusion + optional register link", [
  { label: "jurisdiction hint", ok: has("components/provider-apply/ProviderApplyContent.tsx", "we currently do not accept authorisations issued in that jurisdiction") },
  { label: "register link optional", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Link to your regulatory register entry (optional)") },
  { label: "server rejects auth jurisdiction", ok: has("app/api/providers/profile/draft/route.ts", "Authorisation jurisdiction") },
  { label: "policy version recorded", ok: has("app/api/providers/profile/draft/route.ts", "exclusionPolicyVersion") },
]);

add(2, "Incorporation country exclusion", [
  { label: "incorporation hint", ok: has("components/provider-apply/ProviderApplyContent.tsx", "we currently do not accept providers incorporated in that jurisdiction") },
  { label: "server validateCountrySelection", ok: has("app/api/providers/profile/draft/route.ts", "validateCountrySelection") },
]);

add(3, "Product family selectable cards", [
  { label: "product-family-grid", ok: has("app/globals.css", ".product-family-grid") && has("components/provider-apply/ProviderApplyContent.tsx", "product-family-grid") },
  { label: "brand color", ok: has("app/globals.css", "#826a50") },
]);

add(4, "Separate section per selected product family (preserve drafts)", [
  { label: "ordered sections", ok: has("components/provider-apply/ProviderApplyContent.tsx", "orderedOffers") },
  { label: "no product/account name", ok: missing("components/provider-apply/ProviderApplyContent.tsx", "Product / account name") },
  { label: "soft-disable families", ok: has("lib/provider-apply/state.ts", "active: false") && has("lib/provider-apply/state.ts", "Soft-toggle") },
]);

add(5, "Banking facilities currently available + planned", [
  { label: "banking facilities list", ok: has("lib/provider-apply/config.ts", "Letters of credit (LCs)", "Automated payroll / bulk salary payments") },
  { label: "no capability checkbox", ok: missing("components/provider-apply/product-offer-fields.tsx", "capabilitiesComplete") },
  { label: "planned facilities UI", ok: has("components/provider-apply/product-offer-fields.tsx", "Planned facilities") },
  { label: "planned reminders", ok: has("lib/provider-apply/planned-sync.ts", "sendPlannedReminders") },
]);

add(6, "Merchant payment services + crypto section", [
  { label: "crypto section", ok: has("components/provider-apply/product-offer-fields.tsx", "Crypto-related payment services") },
  { label: "payment acceptance currencies", ok: has("components/provider-apply/product-offer-fields.tsx", "Payment acceptance currencies") || has("lib/provider-apply/config.ts", "Payment acceptance") || has("components/provider-apply/product-offer-fields.tsx", "Payment acceptance") },
]);

add(7, "Private banking + corporate UBO availability", [
  { label: "corporateAccountAvailability", ok: has("components/provider-apply/product-offer-fields.tsx", "corporateAccountAvailability") },
]);

add(8, "Financing facilities currently available", [
  { label: "financing services", ok: has("lib/provider-apply/config.ts", "Business loans / working-capital finance") || has("lib/provider-apply/config.ts", "Invoice finance") },
  { label: "no product name", ok: missing("components/provider-apply/ProviderApplyContent.tsx", "Financing product name") },
]);

add(9, "Correspondent / nested & fund-holding", [
  { label: "clientFundsScope", ok: has("components/provider-apply/product-offer-fields.tsx", "clientFundsScope") },
]);

add(10, "Registration role from landing (no Account type)", [
  { label: "no Account type", ok: missing("app/auth/sign-up/SignUpForm.tsx", "Account type") },
  { label: "Change registration type", ok: has("app/auth/sign-up/SignUpForm.tsx", "Change registration type") },
  { label: "landing role links", ok: has("app/page.tsx", "sign-up?role=applicant", "sign-up?role=provider") },
]);

add(11, "Country acceptance policy upload + extract", [
  { label: "upload default", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Upload your country acceptance policy") },
  { label: "extract API", ok: has("app/api/providers/policy/extract/route.ts", "extractAcceptancePolicy") },
]);

add(12, "Industry acceptance catalogue + EDD + filters", [
  { label: "EDD status", ok: has("lib/provider-apply/config.ts", "Supported with enhanced due diligence") },
  { label: "search activities", ok: has("components/provider-apply/form-controls.tsx", "Search activities") },
  { label: "prohibited filter", ok: has("components/provider-apply/form-controls.tsx", "Prohibited activities") },
  { label: "bulk status", ok: has("components/provider-apply/form-controls.tsx", "Bulk status assignment") },
]);

add(13, "Remove office/employee questions", [
  { label: "no physical offices", ok: missing("components/provider-apply/ProviderApplyContent.tsx", "Physical operating offices required") },
]);

add(14, "Additional acceptance conditions free text", [
  { label: "additional conditions", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Additional acceptance conditions") },
]);

add(15, "Product terms & onboarding redesign", [
  { label: "page title", ok: has("lib/provider-apply/config.ts", "Product terms & onboarding") },
  { label: "remote online IDV", ok: has("lib/provider-apply/config.ts", "Remote — online identity verification") },
  { label: "no legalised docs", ok: missing("components/provider-apply/product-terms-fields.tsx", "legalised") },
  { label: "applicant mirror", ok: has("components/questionnaire/OnboardingPreferencesPanel.tsx", "Onboarding preferences") },
]);

add(16, "Accepted referral methods & pre-approval preview", [
  { label: "referral methods", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Accepted referral methods") },
  { label: "preview SOPHIMA", ok: has("components/provider-apply/ProviderApplyContent.tsx", "Preview SOPHIMA") },
]);

add(17, "Benefits + confirmations; pipeline removed", [
  { label: "pipeline removed", ok: missing("components/provider-apply/ProviderApplyContent.tsx", "What is in your pipeline") },
  { label: "confirmations", ok: has("components/provider-apply/ProviderApplyContent.tsx", "authorised to provide this information") || has("components/provider-apply/ProviderApplyContent.tsx", "authority") },
]);

add(18, "Download my responses", [
  { label: "button", ok: has("components/ProviderProfileWizard.tsx", "Download my responses") },
  { label: "export", ok: has("app/api/providers/profile/export/route.ts", "buildProviderResponsesHtml") },
]);

add(19, "Short validation + Complete this section", [
  { label: "short message", ok: has("components/ProviderProfileWizard.tsx", "Your profile is not ready to submit") },
  { label: "Complete this section", ok: has("components/ProviderProfileWizard.tsx", "Complete this section") },
  { label: "grouped validation", ok: has("lib/provider-apply/validation.ts", "validateAllProviderStepsGrouped") },
]);

add(20, "Review cards + Submit profile to SOPHIMA", [
  { label: "review cards", ok: has("components/provider-apply/ProviderApplyContent.tsx", "review-card") },
  { label: "submit label", ok: has("components/ProviderProfileWizard.tsx", "Submit profile to SOPHIMA") },
  { label: "submitForReview", ok: has("components/ProviderProfileWizard.tsx", "submitForReview") },
]);

add(21, "Reporting preferences (scheduled + ad hoc)", [
  { label: "copy", ok: has("app/provider/preferences/page.tsx", "Choose when to receive a summary") },
  { label: "ad hoc", ok: has("app/provider/preferences/page.tsx", "Request a report now") },
  { label: "next delivery", ok: has("app/provider/preferences/page.tsx", "Next scheduled delivery") },
  { label: "ad hoc API", ok: has("app/api/providers/reporting-preferences/route.ts", "provider_adhoc_report") },
]);

add(22, "Referred cases & reports", [
  { label: "heading/tabs", ok: has("app/provider/reports/page.tsx", "Referred cases") },
  { label: "cases API", ok: has("app/api/providers/cases/route.ts", "introductionRequests") },
]);

add(23, "Sign-in & data settings", [
  { label: "page title", ok: has("app/provider/privacy/page.tsx", "Sign-in & data settings") },
  { label: "password/data flows", ok: has("app/provider/privacy/page.tsx", "change-password") && has("app/api/providers/data-requests/route.ts", "privacyDataRequests") },
]);

add(24, "Provider dashboard + nav labels", [
  { label: "dashboard heading", ok: has("app/provider/page.tsx", "Your provider dashboard") },
  { label: "live status API", ok: has("app/provider/page.tsx", "/api/providers/profile/draft") && has("app/api/providers/profile/draft/route.ts", "statusLabel") },
  { label: "nav labels", ok: has("lib/nav/config.ts", "Institution profile", "Referred cases & reports") },
]);

const implemented = commands.filter((c) => c.status === "implemented");
const partial = commands.filter((c) => c.status === "partial");
const notImpl = commands.filter((c) => c.status === "not");

console.log("FinSyndeo Provider Changes v2 — verification report\n");
for (const c of commands) {
  const tag = c.status === "implemented" ? "OK " : c.status === "partial" ? "PART" : "NO  ";
  console.log(`${tag}  #${String(c.id).padStart(2, "0")}  ${c.name}`);
  if (c.status !== "implemented") console.log(`      ${c.notes}`);
}
console.log("\n--- Summary ---");
console.log(`Total change commands: ${commands.length}`);
console.log(`Implemented: ${implemented.length}`);
console.log(`Partial: ${partial.length}`);
console.log(`Not implemented: ${notImpl.length}`);

if (!existsSync(join(src, "lib/provider-apply/state.ts"))) {
  process.exitCode = 1;
}
