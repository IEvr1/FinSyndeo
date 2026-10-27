/**
 * Verification against 06 Applicant Correspondent Final Aligned.docx (CO01–CO15).
 * Run: node scripts/verify-correspondent-changes.mjs
 */
import { readFileSync } from "fs";
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

function hasNone(rel, patterns) {
  const text = read(rel);
  return patterns.every((p) => !(typeof p === "string" ? text.includes(p) : p.test(text)));
}

const checks = [
  {
    id: "CO01",
    name: "Company and institution identity — category, private company, no EU agent/CSP",
    ok:
      hasAll("lib/questionnaire/correspondent-config.ts", [
        "Bank",
        "Payment institution",
        "Electronic money institution",
        "Money services business",
        "Crypto asset service provider",
      ]) &&
      hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "Institution category",
        "Registered legal name",
        "Institution website",
        "Website unavailable or under development",
      ]) &&
      hasAll("lib/questionnaire/visibility.ts", [
        'id === "entity-type"',
        'id === "agent"',
        'id === "referral"',
      ]) &&
      hasAll("components/QuestionnaireWizard.tsx", ["hideChangeApplicantType={isFinancingFlow(values) || correspondent}"]),
  },
  {
    id: "CO02",
    name: "Dynamic regulatory profile — MSB Canada / CASP branches",
    ok:
      hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "isMsbCanada",
        "Canadian MSB substance",
        "Crypto asset service provider",
        "deactivateCategoryBranches",
      ]) &&
      hasAll("lib/questionnaire/validate-correspondent.ts", ["isMsbCanada", "isCasp"]) &&
      hasNone("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "six client due-diligence case files",
        "Can you provide six client",
      ]),
  },
  {
    id: "CO03",
    name: "Underlying clients and access — nested + direct access separate",
    ok:
      hasAll("lib/questionnaire/correspondent-config.ts", [
        "Individuals",
        "Businesses",
        "Other financial institutions",
      ]) &&
      hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "fi-underlying-countries",
        "fi-downstream",
        "fi-access",
        "Direct access is separate",
      ]),
  },
  {
    id: "CO04",
    name: "Operating baseline + optional client funds; structures; safeguarding confirm",
    ok:
      hasAll("lib/questionnaire/correspondent-config.ts", [
        "Pooled omnibus account",
        "Dedicated virtual accounts or wallets for clients",
      ]) &&
      hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "Operating account — institution own funds",
        "Dedicated client-funds account",
        "co-client-funds",
        "Safeguarding of client funds requires a dedicated client-funds account",
      ]),
  },
  {
    id: "CO05",
    name: "Single additional services catalogue",
    ok:
      hasAll("lib/questionnaire/correspondent-config.ts", [
        "api_connectivity",
        "white_label",
        "card_issuing",
        "crypto_on_ramp",
        "crypto_off_ramp",
        "client_funds_safeguarding",
        "own_funds_fixed_deposits",
      ]) &&
      hasAll("lib/provider-apply/config.ts", [
        "White Label",
        "Card issuing",
        "Crypto on ramp (fiat to crypto)",
        "Crypto off ramp (crypto to fiat)",
        "Safeguarding of client funds",
        "Fixed term deposits (institution own funds)",
      ]),
  },
  {
    id: "CO06",
    name: "EUR/GBP/USD + Must-have/Good to have + rails per currency",
    ok:
      hasAll("lib/questionnaire/correspondent-config.ts", ['"EUR"', '"GBP"', '"USD"']) &&
      hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "Must-have",
        "Good to have",
        "Payment rails (optional)",
        "railsForCurrency",
      ]) &&
      hasAll("lib/provider-apply/config.ts", ["CURRENCY_OPTIONS = [\"EUR\", \"GBP\", \"USD\"]"]) &&
      hasNone("lib/questionnaire/correspondent-config.ts", ["CHF"]),
  },
  {
    id: "CO07",
    name: "Monthly flows by account and currency with bands",
    ok: hasAll("lib/questionnaire/correspondent-config.ts", [
      "No activity",
      "Not yet known",
      "1 to 10",
      "11 to 50",
      "Up to 50,000",
      "Over 50,000 to 200,000",
    ]) &&
      hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "FlowSchedule",
        'scope="operating"',
        'scope="client"',
      ]),
  },
  {
    id: "CO08",
    name: "Compliance — AMLRO Internal/External, no DDQ/compliance contact",
    ok:
      hasAll("lib/questionnaire/correspondent-config.ts", ["Internal", "External"]) &&
      hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "AMLRO",
        "fi-audit-year",
        "CO_AMLRO_CHOICES",
      ]) &&
      hasNone("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
        "fi-ddq",
        "fi-compliance-name",
        "Not yet appointed",
      ]) &&
      hasAll("lib/questionnaire/buildTypedData.ts", ["ddq: null"]) &&
      hasAll("lib/questionnaire/visibility.ts", ["fi-ddq", "fi-compliance-name"]),
  },
  {
    id: "CO09",
    name: "Existing correspondent relationships + reason",
    ok: hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
      "Existing correspondent and payment relationships",
      "co-existing-providers",
      "fi-reason",
      "Add existing provider",
    ]),
  },
  {
    id: "CO10",
    name: "Corporate shareholders + natural-person UBOs",
    ok: hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
      "Are any shareholders legal entities?",
      "Shareholding in the applicant company (%)",
      "Beneficial ownership of the applicant company (%)",
      "A UBO is a natural person",
      "CO_UBO_COVERAGE_TARGET",
    ]),
  },
  {
    id: "CO11",
    name: "Group membership optional name + shared bank cross-service prefs",
    ok: hasAll("components/questionnaire/correspondent/CorrespondentSteps.tsx", [
      "Is your company part of a group?",
      "Group name (optional)",
      "serve other group companies",
      "personal account to a UBO",
    ]),
  },
  {
    id: "CO12",
    name: "Contact + onboarding without Other; no phone required",
    ok:
      hasAll("components/questionnaire/OnboardingPreferencesPanel.tsx", ["hideOtherMethod"]) &&
      hasAll("components/QuestionnaireWizard.tsx", ["hideOtherMethod={correspondent}"]) &&
      hasAll("lib/questionnaire/step-meta.ts", ["Contact and onboarding"]),
  },
  {
    id: "CO13",
    name: "Compact editable assessment summary",
    ok: hasAll("components/questionnaire/correspondent/CorrespondentSummary.tsx", [
      "Company and institution identity",
      "Operating schedules",
      "Client-funds schedules",
      "Existing correspondent and payment relationships",
      "activeCorrespondentBranch",
    ]),
  },
  {
    id: "CO14",
    name: "Layout / saving / validation wiring",
    ok:
      hasAll("components/QuestionnaireWizard.tsx", [
        "validateCorrespondentFields",
        "Progress saved",
        "CorrespondentSteps",
      ]) &&
      hasAll("lib/questionnaire/validate-correspondent.ts", ["isFiller", "meaningful"]),
  },
  {
    id: "CO15",
    name: "Screening / matching / migration foundations in typed data",
    ok:
      hasAll("lib/questionnaire/buildTypedData.ts", [
        "institutionCategory",
        "clientFundsAccount",
        "nestedProcessing",
        "directClientAccess",
        "operationalSchedules",
        "msbCanada",
        "casp",
        "rails",
      ]) &&
      hasAll("lib/questionnaire/correspondent-config.ts", ["CO_PAYMENT_ROUTES"]),
  },
];

let passed = 0;
const failed = [];
for (const c of checks) {
  if (c.ok) {
    passed += 1;
    console.log(`PASS  ${c.id}  ${c.name}`);
  } else {
    failed.push(c);
    console.log(`FAIL  ${c.id}  ${c.name}`);
  }
}

console.log(`\n${passed}/${checks.length} commands implemented (static verification)`);
if (failed.length) {
  console.log("Not fully verified:", failed.map((f) => f.id).join(", "));
  process.exitCode = 1;
}
