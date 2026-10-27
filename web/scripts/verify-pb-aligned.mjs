/**
 * Verification against:
 * 02 Applicant Private Banking Final Aligned.docx
 * Commands: L01, PB01–PB19
 *
 * Run: node scripts/verify-pb-aligned.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function readSrc(rel) {
  const p = join(src, rel);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf8");
}

function hasAll(rel, patterns) {
  const text = readSrc(rel);
  return patterns.every((p) => (typeof p === "string" ? text.includes(p) : p.test(text)));
}

function hasNone(rel, patterns) {
  const text = readSrc(rel);
  return patterns.every((p) => (typeof p === "string" ? !text.includes(p) : !p.test(text)));
}

/** @type {{ id: string, name: string, ok: boolean, note?: string }[]} */
const checks = [
  {
    id: "L01",
    name: "Centre landing heading with registration cards",
    ok:
      hasAll("app/page.tsx", ["Connecting clients with financial institutions", "items-center", "text-center"]) &&
      hasAll("app/page.tsx", ["Register as Applicant", "Register as Provider"]),
  },
  {
    id: "PB01",
    name: "Visible gap between checkbox/radio and label (.checkline)",
    ok: hasAll("app/globals.css", [".checkline {", "gap: 12px", "display: flex"]),
  },
  {
    id: "PB02",
    name: "No Change applicant type on private-banking steps 20–23",
    ok:
      hasNone("components/QuestionnaireWizard.tsx", ["Change applicant type"]) &&
      hasAll("components/questionnaire/ApplicantRouteSelector.tsx", ["Change applicant type"]),
  },
  {
    id: "PB03",
    name: "Additional services; personal account implicit; extras optional as a group",
    ok:
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "Which additional services would you like to use?",
        "in addition to your private-banking account",
      ]) &&
      hasAll("lib/questionnaire/private-banking-config.ts", ["PB_BASELINE_ACCOUNT"]) &&
      !readSrc("lib/questionnaire/private-banking-config.ts").includes('id: "personal",\n  matchLabel') &&
      hasAll("lib/questionnaire/private-banking-config.ts", ["PB_SERVICES = ["]) &&
      !/PB_SERVICES = \[[\s\S]*?id: "personal"/.test(readSrc("lib/questionnaire/private-banking-config.ts")) &&
      hasAll("lib/questionnaire/buildTypedData.ts", ["accountImplicit: true", "baselineCap"]),
  },
  {
    id: "PB04",
    name: "Proposed funds question removed; wealth note retained",
    ok:
      hasNone("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "What is the source of the money you intend to place with the bank?",
      ]) &&
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "The bank may request supporting documents during its application process.",
      ]) &&
      hasNone("lib/questionnaire/validate-private-banking.ts", ["source of the money you intend"]) &&
      hasAll("lib/questionnaire/buildTypedData.ts", ["fundSources: []"]),
  },
  {
    id: "PB05",
    name: "Own-name first; optional sender; relationship dropdown",
    ok:
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "Will the initial funds come from an account in your own name?",
        "optional, if known",
        "PB_THIRD_PARTY_RELATIONSHIPS",
        "Not yet known",
      ]) &&
      hasNone("lib/questionnaire/validate-private-banking.ts", ["Please enter the sender's name"]),
  },
  {
    id: "PB06",
    name: "Yes shows both Incoming and Outgoing; no Direction selector",
    ok:
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "Incoming transfers",
        "Outgoing transfers",
        "No regular incoming transfers expected",
        "No regular outgoing transfers expected",
      ]) &&
      hasNone("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        'values["pb-transfer-direction"]',
        "<span>Direction</span>",
      ]),
  },
  {
    id: "PB07",
    name: "Separate incoming and outgoing purpose lists",
    ok: hasAll("lib/questionnaire/private-banking-config.ts", [
      "PB_INCOMING_PURPOSES",
      "PB_OUTGOING_PURPOSES",
      "Professional services/client fees",
      "Payments to suppliers/service providers",
    ]),
  },
  {
    id: "PB08",
    name: "EUR-only placement; account currencies EUR/GBP/USD only",
    ok:
      hasAll("lib/questionnaire/private-banking-config.ts", [
        'export const PB_CURRENCIES = ["EUR", "GBP", "USD"]',
      ]) &&
      hasNone("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "pb-placement-currency",
      ]) &&
      hasAll("lib/questionnaire/buildTypedData.ts", ['placementCurrency: "EUR"']),
  },
  {
    id: "PB09",
    name: "Field-level validation errors with focus target",
    ok:
      hasAll("lib/questionnaire/validate-private-banking.ts", [
        "validatePrivateBankingFields",
        "Select at least one account currency",
        "Choose Must-have or Good to have",
      ]) &&
      hasAll("components/QuestionnaireWizard.tsx", ["fieldErrors", "focusFirstFieldError"]),
  },
  {
    id: "PB10",
    name: "Compact summary label/value rows",
    ok:
      hasAll("app/globals.css", [".summary-row", "grid-template-columns"]) &&
      hasAll("components/questionnaire/private-banking/PrivateBankingSummary.tsx", [
        "summary-row",
        "Expected placement (EUR)",
      ]) &&
      hasNone("components/questionnaire/private-banking/PrivateBankingSummary.tsx", [
        "Source of proposed funds",
      ]),
  },
  {
    id: "PB11",
    name: "Assessment ID retained for alerts + return to results",
    ok:
      hasAll("app/applicant/alerts/AlertsContent.tsx", [
        "applicationId",
        "Back to this assessment",
        "useSearchParams",
      ]) &&
      hasAll("components/applicant/ResultsFlow.tsx", ["/applicant/alerts?applicationId="]),
  },
  {
    id: "PB12",
    name: "Revision conflict preserves in-memory answers with recovery actions",
    ok: hasAll("components/QuestionnaireWizard.tsx", [
      "revisionConflict",
      "Keep my answers and save again",
      "Load the latest saved version",
      "have not been confirmed saved",
    ]),
  },
  {
    id: "PB13",
    name: "Readable Individual — Private banking route labels",
    ok:
      hasAll("lib/questionnaire/private-banking-config.ts", [
        'individual: "Individual — Private banking"',
        "formatAssessmentRoute",
      ]) &&
      hasAll("app/applicant/assessments/page.tsx", ["formatAssessmentRoute"]) &&
      hasAll("app/applicant/alerts/AlertsContent.tsx", ["formatAssessmentRoute"]) &&
      hasAll("app/applicant/ApplicantDashboard.tsx", ["formatAssessmentRoute"]),
  },
  {
    id: "PB14",
    name: "Evidence/verification script present (this file)",
    ok: true,
    note: "Static record only — live browser evidence still needed for production acceptance",
  },
  {
    id: "PB15",
    name: "Must-have/Good to have; optional currency rails; EUR/GBP/USD",
    ok:
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "Must-have",
        "Good to have",
        "Payment methods for",
        "railsForCurrency",
      ]) &&
      hasAll("lib/questionnaire/buildTypedData.ts", ["paymentMethods"]),
  },
  {
    id: "PB16",
    name: "Funding match without reintroducing proposed-funds; optional sender unknown",
    ok:
      hasAll("lib/matching/legacy/matching-engine.js", [
        "funds.proposed",
        "funds.thirdParty.sender",
        "Joint",
      ]) &&
      hasAll("lib/questionnaire/buildTypedData.ts", ["fundSources: []", "thirdPartyFunding"]),
  },
  {
    id: "PB17",
    name: "Individual route: Personal details first; no Company/Contact step",
    ok:
      hasAll("lib/questionnaire/flows.ts", ["[0, 1, 20, 21, 22, 23, 40]", "isPersonalFlow"]) &&
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "Tell us about yourself.",
        "Contact email",
      ]),
  },
  {
    id: "PB18",
    name: "Per-currency monthly estimate bands after Yes",
    ok:
      hasAll("lib/questionnaire/private-banking-config.ts", [
        "PB_COUNT_BANDS",
        "PB_AMOUNT_BANDS",
        "inCountKey",
        "outAmountKey",
      ]) &&
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "Expected transactions per month (",
        "Expected total amount per month (",
      ]) &&
      hasAll("lib/questionnaire/buildTypedData.ts", ["monthlyByCurrency"]),
  },
  {
    id: "PB19",
    name: "Personal details shortcuts and fields restated",
    ok: hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
      "Tell us about yourself.",
      "I also live in",
      " as a tax residence",
      "You can add other tax-residence countries.",
      "Contact is by email",
    ]),
  },
];

let passed = 0;
let failed = 0;
const fails = [];
console.log("Private Banking Final Aligned — static verification\n");
for (const c of checks) {
  const mark = c.ok ? "PASS" : "FAIL";
  if (c.ok) passed++;
  else {
    failed++;
    fails.push(c.id);
  }
  console.log(`${mark}  ${c.id} — ${c.name}${c.note ? ` (${c.note})` : ""}`);
}
console.log(`\n${passed}/${checks.length} implemented (static checks). ${failed} failing.`);
if (fails.length) console.log("Failed:", fails.join(", "));
process.exit(failed ? 1 : 0);
