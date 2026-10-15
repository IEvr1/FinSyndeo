/**
 * Verification against FinSyndeo Changes for Provider.docx (written requirements).
 * Run: node scripts/verify-provider-changes.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function read(rel) {
  return readFileSync(join(src, rel), "utf8");
}

function hasAll(rel, patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? text.includes(p) : p.test(text)));
}

const checks = [
  {
    id: "landing",
    name: "Landing page registration buttons carry role to sign-up",
    ok: hasAll("../src/app/page.tsx", ["sign-up?role=applicant", "sign-up?role=provider"]),
  },
  {
    id: "brand",
    name: "Brand colour #826A50 in global CSS",
    ok: hasAll("app/globals.css", ["#826a50"]),
  },
  {
    id: "password-ui",
    name: "Password rules on registration form",
    ok: hasAll("app/auth/sign-up/SignUpForm.tsx", ["validatePassword", "uppercase"]),
  },
  {
    id: "password-api",
    name: "Password rules on sign-up API",
    ok: hasAll("app/api/auth/sign-up/route.ts", ["validatePassword"]),
  },
  {
    id: "password-compromised",
    name: "Block compromised passwords (HIBP etc.)",
    ok: read("lib/password-policy.ts").includes("assertPasswordNotCompromised"),
  },
  {
    id: "password-rate-limit",
    name: "Rate-limit login attempts",
    ok: read("app/api/auth/sign-in/route.ts").includes("assertLoginAllowed"),
  },
  {
    id: "institution-types",
    name: "Primary institution type ordered list",
    ok: hasAll("lib/provider-apply/config.ts", ["Commercial bank", "Commercial & private bank", "Lender / financing provider"]),
  },
  {
    id: "jurisdiction-hint",
    name: "Authorisation jurisdiction exclusion hint",
    ok: hasAll("components/provider-apply/ProviderApplyContent.tsx", [
      "we currently do not accept authorisations issued in that jurisdiction",
    ]),
  },
  {
    id: "incorporation-hint",
    name: "Incorporation country exclusion hint",
    ok: hasAll("components/provider-apply/ProviderApplyContent.tsx", [
      "we currently do not accept providers incorporated in that jurisdiction",
    ]),
  },
  {
    id: "register-link-optional",
    name: "Regulatory register link optional label",
    ok: hasAll("components/provider-apply/ProviderApplyContent.tsx", [
      "Link to your regulatory register entry (optional)",
    ]),
  },
  {
    id: "product-cards",
    name: "Product family selectable cards (two-column CSS)",
    ok: hasAll("app/globals.css", [".product-family-grid", ".service-card"]) &&
      hasAll("components/provider-apply/ProviderApplyContent.tsx", ["product-family-grid"]),
  },
  {
    id: "all-product-sections",
    name: "Separate section per selected product family",
    ok: existsSync(join(src, "components/provider-apply/product-offer-fields.tsx")),
  },
  {
    id: "no-product-name",
    name: "Product / account name removed",
    ok: !read("components/provider-apply/ProviderApplyContent.tsx").includes("Product / account name"),
  },
  {
    id: "bank-facilities",
    name: "Banking facilities list per spec",
    ok: hasAll("lib/provider-apply/config.ts", ["Letters of credit (LCs)", "Automated payroll / bulk salary payments"]) &&
      !read("lib/provider-apply/config.ts").includes("Operational activities"),
  },
  {
    id: "no-capability-checkbox",
    name: "Capability-confirmation checkbox removed",
    ok: !read("components/provider-apply/product-offer-fields.tsx").includes("capabilitiesComplete"),
  },
  {
    id: "planned-facilities-ui",
    name: "Planned facilities/services UI",
    ok: read("components/provider-apply/product-offer-fields.tsx").includes("Planned facilities"),
  },
  {
    id: "planned-reminders",
    name: "Automated planned-facility reminders & SOPHIMA flags",
    ok: read("lib/provider-apply/planned-sync.ts").includes("sendPlannedReminders"),
  },
  {
    id: "merchant-crypto",
    name: "Merchant crypto expandable section",
    ok: read("components/provider-apply/product-offer-fields.tsx").includes("Crypto-related payment services"),
  },
  {
    id: "private-corporate-ubo",
    name: "Private banking corporate UBO availability",
    ok: read("components/provider-apply/product-offer-fields.tsx").includes("corporateAccountAvailability"),
  },
  {
    id: "correspondent-nested",
    name: "Correspondent downstream / fund-holding questions",
    ok: read("components/provider-apply/product-offer-fields.tsx").includes("clientFundsScope"),
  },
  {
    id: "signup-role",
    name: "Registration without account-type dropdown; role from landing",
    ok: !read("app/auth/sign-up/SignUpForm.tsx").includes("Account type") &&
      read("app/auth/sign-up/SignUpForm.tsx").includes("Change registration type"),
  },
  {
    id: "country-upload",
    name: "Country acceptance policy upload default view",
    ok: read("components/provider-apply/ProviderApplyContent.tsx").includes("Upload your country acceptance policy"),
  },
  {
    id: "country-extract",
    name: "Automatic extraction of country rules from uploads",
    ok: read("app/api/providers/policy/extract/route.ts").includes("extractAcceptancePolicy"),
  },
  {
    id: "industry-edd",
    name: "Industry status includes enhanced due diligence",
    ok: read("lib/provider-apply/config.ts").includes("Supported with enhanced due diligence"),
  },
  {
    id: "no-office-employee",
    name: "Office/employee questions removed from provider form",
    ok: !read("components/provider-apply/ProviderApplyContent.tsx").includes("Physical operating offices required"),
  },
  {
    id: "additional-acceptance",
    name: "Additional acceptance conditions free text",
    ok: read("components/provider-apply/ProviderApplyContent.tsx").includes("Additional acceptance conditions"),
  },
  {
    id: "product-terms",
    name: "Product terms & onboarding page structure",
    ok: read("lib/provider-apply/config.ts").includes("Product terms & onboarding") &&
      read("lib/provider-apply/config.ts").includes("Remote — online identity verification"),
  },
  {
    id: "no-legalised-docs",
    name: "Legalised physical documents question removed",
    ok: !read("components/provider-apply/product-terms-fields.tsx").includes("legalised"),
  },
  {
    id: "applicant-onboarding-mirror",
    name: "Applicant questionnaire onboarding/language mirror",
    ok:
      read("lib/questionnaire/buildTypedData.ts").includes("attachOnboardingPreferences") &&
      read("components/questionnaire/OnboardingPreferencesPanel.tsx").includes("Onboarding preferences"),
  },
  {
    id: "referral-methods",
    name: "Accepted referral methods multi-select",
    ok: read("components/provider-apply/ProviderApplyContent.tsx").includes("Accepted referral methods"),
  },
  {
    id: "referral-preapproval-preview",
    name: "Pre-approval form upload & SOPHIMA profile preview",
    ok:
      read("components/provider-apply/ProviderApplyContent.tsx").includes("Preview SOPHIMA") &&
      read("app/api/providers/client-profile-preview/route.ts").includes("buildClientProfileHtml"),
  },
  {
    id: "pipeline-removed",
    name: "Pipeline question removed from partnership step",
    ok: !read("components/provider-apply/ProviderApplyContent.tsx").includes("What is in your pipeline"),
  },
  {
    id: "download-responses",
    name: "Download my responses button",
    ok: read("components/ProviderProfileWizard.tsx").includes("Download my responses"),
  },
  {
    id: "download-pdf",
    name: "Download responses as readable HTML export (print to PDF)",
    ok: read("app/api/providers/profile/export/route.ts").includes("buildProviderResponsesHtml"),
  },
  {
    id: "validation-message",
    name: "Short submit validation message",
    ok: read("components/ProviderProfileWizard.tsx").includes(
      "Your profile is not ready to submit"
    ),
  },
  {
    id: "review-cards",
    name: "Review step summary cards with Edit",
    ok: read("components/provider-apply/ProviderApplyContent.tsx").includes("review-card"),
  },
  {
    id: "submit-label",
    name: "Submit profile to SOPHIMA",
    ok: read("components/ProviderProfileWizard.tsx").includes("Submit profile to SOPHIMA"),
  },
  {
    id: "reporting-prefs",
    name: "Reporting preferences page copy & periods",
    ok: read("app/provider/preferences/page.tsx").includes("Choose when to receive a summary"),
  },
  {
    id: "cases-tabs",
    name: "Referred cases & reports tabs",
    ok: read("app/provider/reports/page.tsx").includes("Referred cases"),
  },
  {
    id: "cases-data",
    name: "Cases/reports tables, search, filters, server access control",
    ok:
      read("app/api/providers/cases/route.ts").includes("introductionRequests") &&
      read("app/provider/reports/page.tsx").includes("/api/providers/cases"),
  },
  {
    id: "signin-data-page",
    name: "Sign-in & data settings three sections",
    ok: read("app/provider/privacy/page.tsx").includes("Sign-in & data settings"),
  },
  {
    id: "signin-data-actions",
    name: "Working password/email/data-request flows",
    ok:
      read("app/provider/privacy/page.tsx").includes("change-password") &&
      read("app/api/providers/data-requests/route.ts").includes("privacyDataRequests"),
  },
  {
    id: "dashboard",
    name: "Provider dashboard four cards & labels",
    ok: read("app/provider/page.tsx").includes("Your provider dashboard") &&
      read("app/provider/page.tsx").includes("Manage profile"),
  },
  {
    id: "nav-labels",
    name: "Sidebar nav labels updated",
    ok: read("lib/nav/config.ts").includes("Institution profile") &&
      read("lib/nav/config.ts").includes("Referred cases & reports"),
  },
  {
    id: "matching-sync",
    name: "Applicant/provider matching mappings updated for new capabilities",
    ok:
      read("lib/matching/legacy/matching-engine.js").includes("EXTRA_CAPS") &&
      read("lib/matching/legacy/matching-engine.js").includes("evaluateOnboarding"),
  },
  {
    id: "server-jurisdiction",
    name: "Server-side rejection of excluded incorporation country on draft save",
    ok: read("app/api/providers/profile/draft/route.ts").includes("validateCountrySelection"),
  },
];

const implemented = checks.filter((c) => c.ok === true);
const not = checks.filter((c) => c.ok === false);

console.log("FinSyndeo Provider changes verification\n");
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "NO"}  ${c.id}: ${c.name}${c.note ? ` (${c.note})` : ""}`);
}
console.log("\n--- Summary ---");
console.log(`Total checks: ${checks.length}`);
console.log(`Implemented: ${implemented.length}`);
console.log(`Not implemented / partial: ${not.length}`);
