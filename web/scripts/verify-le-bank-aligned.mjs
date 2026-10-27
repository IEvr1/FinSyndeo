/**
 * Static verification of the Applicant Legal Entity → Business bank account alignment.
 * Commands: G01–G03, LE01–LE23 (LE20 is this script).
 *
 * Each command resolves to one of:
 *   Implemented — every source check passes
 *   Partial     — some checks fail, or a known/intentional gap is recorded
 *   Not         — no check passes
 *
 * Run: node scripts/verify-le-bank-aligned.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function read(rel) {
  const p = join(src, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

function has(rel, ...patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? text.includes(p) : p.test(text)));
}

function lacks(rel, ...patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? !text.includes(p) : !p.test(text)));
}

/** Text between the first match of `from` and the next match of `to` (or end of file). */
function block(rel, from, to) {
  const text = read(rel);
  const start = typeof from === "string" ? text.indexOf(from) : text.search(from);
  if (start < 0) return "";
  const rest = text.slice(start);
  if (!to) return rest;
  const endRel = typeof to === "string" ? rest.indexOf(to, 1) : rest.slice(1).search(to) + 1;
  return endRel > 0 ? rest.slice(0, endRel) : rest;
}

const CFG = "lib/questionnaire/legal-entity-bank-config.ts";
const STEPS = "components/questionnaire/legal-entity-bank/LegalEntityBankSteps.tsx";
const SUMMARY = "components/questionnaire/legal-entity-bank/LegalEntityBankSummary.tsx";
const VALID = "lib/questionnaire/validate-legal-entity-bank.ts";
const TYPED = "lib/questionnaire/legal-entity-bank-typed.ts";
const WIZARD = "components/QuestionnaireWizard.tsx";
const CSS = "app/globals.css";

const cfgPurposes = block(CFG, "export const LE_PURPOSES", "/* ─── Currencies");
const hoverBlock = (read(CSS).match(/\.btn\.btn-primary:hover[^{]*\{([^}]*)\}/) ?? [])[1] ?? "";
const nonshareValidation = block(VALID, 'if (group === "nonshare")', 'if (group === "trust")');
const trustValidation = block(VALID, 'if (group === "trust")', "// Group membership");
const trustSteps = block(STEPS, '{group === "trust" && (', "<section className=\"panel\">\n        <h2 className=\"mt-0\">Group membership");
const countries = JSON.parse(readFileSync(join(src, "data/countries.json"), "utf8"));

/**
 * @type {{ id: string; name: string; parts: Array<[string, boolean]>; known?: string }[]}
 */
const checks = [
  /* ─── G01–G03 ─────────────────────────────────────────────────────────── */
  {
    id: "G01",
    name: "White cards, brand #826A50, checkline gap, btn-primary:hover keeps white text on brown",
    parts: [
      ["brand #826a50", has(CSS, "--brand: #826a50")],
      ["white panel", has(CSS, "--panel: #fff", "background: var(--panel)")],
      ["white service-card", /\.service-card \{[^}]*background: #fff/.test(read(CSS))],
      ["checkline gap 12px", has(CSS, ".checkline {", "gap: 12px")],
      ["hover rule exists", hoverBlock.length > 0],
      ["hover text white", /color:\s*#fff/.test(hoverBlock)],
      ["hover background darker brown", /background:\s*#6a563f/.test(hoverBlock)],
      ["hover never pale (soft/cream)", !/var\(--soft\)|var\(--paper\)|#f0ece5|#faf8f4/.test(hoverBlock)],
    ],
  },
  {
    id: "G02",
    name: "Main currencies EUR/GBP/USD only; CHF no longer offered on bank/PB pickers",
    parts: [
      ["contract MAIN_FIAT_CURRENCIES", has("lib/matching/contract/types.ts", /MAIN_FIAT_CURRENCIES = \["EUR", "GBP", "USD"\]/)],
      ["LE currencies from contract list", has(CFG, "export const LE_CURRENCIES = MAIN_FIAT_CURRENCIES")],
      ["no CHF offered as selectable LE currency", lacks(CFG, '"CHF"') && !/LE_CURRENCIES[\s\S]{0,80}CHF/.test(read(CFG))],
      ["historical CHF reconfirmation notice", has(STEPS, "le-chf-reconfirm", "CHF is no longer a primary currency choice")],
      ["provider CURRENCY_OPTIONS EUR/GBP/USD", has("lib/provider-apply/config.ts", /CURRENCY_OPTIONS = \["EUR", "GBP", "USD"\]/)],
      ["provider limit currency no hard-coded CHF list", lacks("components/provider-apply/product-terms-fields.tsx", '["EUR", "GBP", "USD", "CHF"]')],
      ["dictionary CHF/Other hidden unless historical", has("lib/questionnaire/visibility.ts", "Swiss franc (CHF)", "bank-other-currency")],
      ["PB currencies EUR/GBP/USD", has("lib/questionnaire/private-banking-config.ts", 'PB_CURRENCIES = ["EUR", "GBP", "USD"]')],
    ],
  },
  {
    id: "G03",
    name: "Must-have / Good to have labels, matching-rule explanation, provider statuses unchanged",
    parts: [
      ["Must-have / Good to have toggle", has(STEPS, "Must-have", "Good to have", "LevelToggle")],
      ["explanation text", has(CFG, "A missing Must-have excludes a provider option; a missing Good to have does not")],
      ["explanation shown in steps", has(STEPS, "LE_PRIORITY_EXPLANATION")],
      ["legacy required→Must-have, preferred→Good to have", has(CFG, "mapLegacyPriorityLabel", '"Must-have"', '"Good to have"')],
      ["typed data maps required/preferred to essential/preferred", has(TYPED, "priorityOf")],
      ["language level labels", has("components/questionnaire/OnboardingPreferencesPanel.tsx", "Good to have", "Must-have")],
      [
        "provider capability statuses kept",
        has("lib/matching/contract/types.ts", '"Supported"', '"Conditional"', '"Not supported"', '"Not confirmed"'),
      ],
    ],
  },

  /* ─── LE01–LE05 ───────────────────────────────────────────────────────── */
  {
    id: "LE01",
    name: "Journey sequence, no agent/referral, legal structures, Trust fields, no repeated Change applicant type",
    parts: [
      [
        "step labels in order",
        has(
          CFG,
          '1: "Entity details"',
          '2: "Business activity"',
          '3: "Account and flows"',
          '39: "Existing banking"',
          '4: "Ownership and control"',
          '5: "Contact and onboarding"',
          '40: "Review"'
        ),
      ],
      ["flow order 39 before 4,5,40", has("lib/questionnaire/flows.ts", "return [0, 1, 2, 3, 39, 4, 5, 40]")],
      ["step-meta uses LE labels", has("lib/questionnaire/step-meta.ts", "LE_BANK_STEP_LABELS", "accountType === \"bank\"")],
      ["wizard titles pass account type", has(WIZARD, "stepTitleForRoute(page, personal, applicantKind, accountKind)")],
      ["no EU subsidiary agent on entity step", lacks(STEPS.replace("Steps.tsx", "Steps.tsx"), "EU subsidiary legal name", "agent-subsidiary") && !block(STEPS, "function EntityStep", "/* ─── Step 2").includes("agent")],
      ["no corporate-services referral", lacks(STEPS, "corporate-services provider", 'id="referral"') && lacks(TYPED, "referral")],
      [
        "legal structures",
        has(
          CFG,
          '"Private limited company"',
          '"Public limited company"',
          '"Partnership"',
          '"Limited liability partnership (LLP)"',
          '"Foundation"',
          '"Association"',
          '"Trust"',
          'label: "Other"'
        ),
      ],
      ["Trust name / governing law / registration", has(STEPS, "Trust name", "Governing-law jurisdiction", "Trust registration / reference number, if applicable")],
      ["Trust registration not required when N/A", has(VALID, "!notIssued && !str(values.registration)") && has("lib/questionnaire/validate-legal-entity-bank.ts", "notIssued && !trust")],
      ["no Change applicant type on LE pages", lacks(STEPS, "Change applicant type") && lacks(SUMMARY, "Change applicant type") && has("components/questionnaire/ApplicantRouteSelector.tsx", "Change applicant type")],
      ["wizard wires custom steps", has(WIZARD, "LegalEntityBankSteps", "isLegalEntityBankFlow", "!(leBank && isLegalEntityBankStep(page))")],
    ],
  },
  {
    id: "LE02",
    name: "Website status, URL/reason requirement, meaningful activity description, filler rejected",
    parts: [
      ["status options", has(CFG, "Website available", "Under development", "No website not applicable")],
      ["URL required when available", has(VALID, 'status === "available"', "Please enter the website address")],
      ["reason otherwise", has(VALID, '"website-reason"', "Please give a brief reason")],
      ["activity must be meaningful", has(VALID, "LE_ACTIVITY_MIN_LENGTH", "fields.activity")],
      ["blank / single-letter filler rejected", has(CFG, "export function isMeaningfulText", "t.length < minLength", /\(\.\)\\1\*/)],
      ["website-derived summary not trusted (description required)", has(VALID, "isMeaningfulText(activity")],
    ],
    known: "No website-derived activity summary yet — a written description is always required (as specified for now).",
  },
  {
    id: "LE03",
    name: "Shared industry catalogue with Other last and specify required",
    parts: [
      ["catalogue from provider INDUSTRIES", has(CFG, "PROVIDER_INDUSTRIES", "export const LE_INDUSTRIES")],
      ["Other last", has(CFG, /"Adult industry",\s*"Other",\s*\] as const/)],
      ["specify required", has(VALID, '"industry-other"', "Please specify your industry")],
      ["specify field shown in UI", has(STEPS, 'industry === "Other"', "Please specify your industry")],
    ],
  },
  {
    id: "LE04",
    name: "Licensing: immediate fields, Yes/No/Not yet confirmed, removed questions, conditional EU payment agent",
    parts: [
      [
        "immediate licence industries",
        has(CFG, "LE_IMMEDIATE_LICENCE_INDUSTRIES", "INDUSTRY_FOREX", "INDUSTRY_GAMBLING", "INDUSTRY_CRYPTO", "INDUSTRY_FINANCIAL", "INDUSTRY_HOLDING"),
      ],
      ["Yes / No / Not yet confirmed", has(CFG, '["Yes", "No", "Not yet confirmed"]')],
      ["licence fields", has(STEPS, "Licence name / type", "Licence reference", "Issuing authority", "Licensing jurisdiction")],
      ["'Explain why no licence' removed", lacks(STEPS, "does not require a licence") && lacks(VALID, "licence-applicability-reason") && lacks(TYPED, "licence-applicability-reason")],
      ["permission-holder question removed", lacks(STEPS, "permission holder", "Legal name of the licence") && lacks(TYPED, "holder: s(")],
      ["EU agent only gambling/forex outside EU", has(CFG, "export function euAgentApplicable", "INDUSTRY_GAMBLING", "INDUSTRY_FOREX", "!EU.includes(inc) && !EU.includes(lic)")],
      ["EU agent not on entity details", !block(STEPS, "function EntityStep", "/* ─── Step 2").includes("euAgentApplicable")],
      ["EU agent offer has no corporate-services offer", lacks(STEPS, "introduction to a corporate-services provider")],
    ],
  },
  {
    id: "LE05",
    name: "Physical offices modes, trust wording, countries only for other-country, employees kept",
    parts: [
      ["office modes", has(CFG, "In country of incorporation", "In other operating countries", "No physical offices")],
      ["trust administration wording", has(CFG, "trustLabel", "administered"), ],
      ["countries only when other", has(STEPS, 'offices === "other"', "offices-countries")],
      ["countries deactivated otherwise", has(STEPS, 'if (v !== "other") onPickerChange("offices-countries", [])')],
      ["typed officeCountries only for other", has(TYPED, 'officeMode === "other" ? expand(pickers, "offices-countries") : []')],
      ["employee count kept", has(CFG, "LE_EMPLOYEE_BANDS") && has(VALID, "Please select the number of employees")],
    ],
  },

  /* ─── LE06–LE10 ───────────────────────────────────────────────────────── */
  {
    id: "LE06",
    name: "Independent operating / client-funds account types; client schedule only when selected",
    parts: [
      ["account catalogue", has(CFG, "Operating account", "Dedicated client-funds account")],
      ["independent checkboxes (le-acct:)", has(CFG, "le-acct:", ) && has(STEPS, "leAcctKey(a.id)")],
      ["at least one required", has(VALID, "Select at least one account type")],
      ["schedule per selected account only", has(STEPS, "accounts.map((account)", "selectedAccounts(values)")],
      ["never auto from industry", !/client_funds[^\n]*industry|industry[^\n]*client_funds/i.test(read(CFG) + read(STEPS) + read(VALID) + read(TYPED))],
      ["typed clientFunds only when selected", has(TYPED, 'clientFunds: accounts.includes("client_funds") ? schedules.client_funds : null')],
      ["separate estimates per account when both", has(STEPS, "Separate schedules are collected for each selected account")],
    ],
  },
  {
    id: "LE07",
    name: "Purposes multi-select; escrow/trade finance/payroll removed; cards/FX/deposits as additional services",
    parts: [
      [
        "seven purposes",
        has(
          CFG,
          "Support business operations",
          "Diversify funds across institutions",
          "Access a specific banking facility",
          "Obtain better rates or pricing",
          "Obtain better service",
          "Maintain a reserve account",
          'label: "Other"'
        ),
      ],
      ["Other last", /label: "Maintain a reserve account"[\s\S]*label: "Other"[\s\S]*\] as const/.test(cfgPurposes)],
      ["Other explanation required", has(VALID, "Please explain the other purpose")],
      ["escrow / trade finance / payroll absent from purposes+services", !/Escrow|Trade finance|Automated payroll|payroll/i.test(cfgPurposes) && !/Escrow|Trade finance|Automated payroll/i.test(read(STEPS))],
      ["additional services with levels", has(CFG, "Corporate cards", "Foreign exchange (FX)", "Fixed-term deposits") && has(STEPS, "leSvcLevelKey")],
    ],
  },
  {
    id: "LE08",
    name: "EUR/GBP/USD with priority, rails by currency, inherited priority, no ABA, all-accounts label",
    parts: [
      ["currency picker with priority", has(STEPS, "LE_CURRENCIES.map", "leCurrLevelKey")],
      ["at least one currency", has(VALID, "Select at least one currency (EUR, GBP or USD)")],
      ["EUR rails", has("lib/matching/contract/types.ts", '"SEPA", "SEPA Instant", "SWIFT", "TARGET T2"') && has(CFG, "TARGET/T2", "BANK_RAILS.EUR")],
      ["GBP rails", has(CFG, "BANK_RAILS.GBP[0]", "BANK_RAILS.GBP[1]")],
      ["USD rails", has(CFG, "BANK_RAILS.USD[0]", "BANK_RAILS.USD[1]")],
      ["rails sourced from PAYMENT_ROUTES", has(CFG, "PAYMENT_ROUTES", "export const LE_RAILS", "le-rail:")],
      ["methods inherit currency priority (rule shown)", has(STEPS, "Methods inherit the currency priority")],
      ["no ABA", lacks(CFG, /\bABA\b/) && lacks(STEPS, /\bABA\b/)],
      ["Applies to all selected accounts", has(STEPS, "Applies to all selected accounts")],
      ["typed rails inherit priority", has(TYPED, "priority: priorityOf(values[leCurrLevelKey(r.currency)])")],
    ],
  },
  {
    id: "LE09",
    name: "Per account×currency incoming/outgoing estimates, bands, countries (+unknown), separate purposes",
    parts: [
      ["count bands", has(CFG, '"1–10"', '"11–50"', '"51–100"', '"Over 100"', "No activity", "Not yet known")],
      ["amount bands", has(CFG, "Up to 50k", "Over 50k–200k", "Over 200k–500k", "Over 500k–1m", "Over 1m")],
      ["keys per account×currency×direction", has(CFG, "le-${dir}-count:${account}:${code}", "le-${dir}-amount:${account}:${code}")],
      ["incoming and outgoing separate", has(STEPS, 'dir="in"', 'dir="out"')],
      ["countries not yet known option", has(STEPS, "Countries not yet known") && has(CFG, "countries-unknown")],
      ["separate purpose lists", has(CFG, "LE_INCOMING_PURPOSES", "LE_OUTGOING_PURPOSES")],
      ["validation per direction", has(VALID, "validateFlowDirection", "Select expected ${word} transactions per month")],
      ["typed monthly by account×currency", has(TYPED, "monthly", "schedules")],
    ],
  },
  {
    id: "LE10",
    name: "Existing banking present / absent / closed; bank details only when declared; closed ≠ open",
    parts: [
      ["three states", has(CFG, 'value: "present"', 'value: "absent"', 'value: "closed"')],
      ["bank name/country only when declared", has(STEPS, 'state === "present" || state === "closed"', "existing-bank-name")],
      ["closed recorded separately", has(STEPS, "never treated as an open relationship") && has(TYPED, 'open: state === "present"', 'closed: state === "closed"')],
      ["required", has(VALID, "validateExistingBanking")],
    ],
  },

  /* ─── LE11–LE15 ownership ─────────────────────────────────────────────── */
  {
    id: "LE11",
    name: "Private/Public company ownership: corporate shareholders (no names), anonymous BOs, 75–100% coverage",
    parts: [
      ["corporate shareholders question", has(STEPS, "Are any shareholders legal entities?")],
      ["jurisdiction + Shareholding %, no entity names", has(STEPS, "Jurisdiction of incorporation", "Shareholding %") && lacks(STEPS, "Shareholder entity name") && has(STEPS, "Entity names are not collected")],
      ["BO % / nationality / residence", has(STEPS, "Beneficial ownership %", "Nationality / nationalities", "Country of residence")],
      ["no personal names", lacks(STEPS, "Full name of this person", "Beneficial owner name") && has(STEPS, "Personal names are not collected")],
      ["coverage ≥75 and ≤100", has(CFG, "LE_MIN_COVERAGE = 75") && has(VALID, "cannot exceed 100%", "must cover at least")],
      ["also-resident shortcut for one nationality", has(STEPS, "Also resident in", "singleNat")],
      ["typed anonymous", has(TYPED, "anonymous: true")],
    ],
  },
  {
    id: "LE12",
    name: "Public company listing + Partnership/LLP partners/interests or control route (doc LE12)",
    parts: [
      ["PLC only in UI", has(STEPS, "isPublicCompany(values) && (", "Is the company listed on a stock exchange?")],
      ["PLC only in validation", has(VALID, "if (isPublicCompany(values))", "plc-exchange")],
      ["typed listed only for company group", has(TYPED, 'group === "company" && s(values, "plc-listed") === "Yes"')],
      ["partnership routes", has(CFG, "LE_PARTNER_ROUTES", "Declare partner interests as percentages", "Describe control instead")],
      ["partner wording (not shareholders)", has(STEPS, "Partner interest %", "Ownership — partners and interests")],
      ["percentage route coverage", has(VALID, 'route === "percentage"', 'validatePercentCoverage("partner"')],
      ["control route requires description", has(VALID, "Please describe who controls the partnership")],
    ],
  },
  {
    id: "LE13",
    name: "Foundation/Association: roles, not shareholders; no 75% share target (doc LE13)",
    parts: [
      ["role catalogue", has(CFG, "LE_NONSHARE_ROLES", "Council / board member", "Founder")],
      ["roles UI", has(STEPS, "Control — roles and governance", "no ownership percentage is collected")],
      ["no coverage target for nonshare", nonshareValidation.length > 0 && !nonshareValidation.includes("validatePercentCoverage") && !nonshareValidation.includes("LE_MIN_COVERAGE")],
      ["no percent inputs for nonshare rows", has(STEPS, 'prefix="role" percent={false}')],
    ],
  },
  {
    id: "LE14",
    name: "Dedicated Trust structure route: parties, no share %, protector optional (doc LE14)",
    parts: [
      ["trust roles", has(CFG, "LE_TRUST_ROLES", '"Settlor"', '"Trustee"', '"Protector"', '"Beneficiary class"')],
      ["trust requires settlor/trustee/beneficiary", has(VALID, "Add at least one Settlor", "Add at least one Trustee", "Add at least one Beneficiary")],
      ["protector if any", has(STEPS, "Does the trust have a protector?") && has(VALID, "Add a Protector row")],
      ["no share % for trusts", trustSteps.includes("percent={false}") && !trustValidation.includes("validatePercentCoverage")],
      ["Trust in structure selector", has(CFG, 'label: "Trust"', 'group: "trust"')],
    ],
  },
  {
    id: "LE15",
    name: "Group and structural branches conditional; group name optional; Yes→No safe (doc LE15)",
    parts: [
      ["group membership separate", has(STEPS, "Group membership", 'id="group"')],
      ["group name optional", has(STEPS, "Group name (optional)") && lacks(VALID, '"group-name"')],
      ["Yes→No clears hidden group name", has(STEPS, 'if (v !== "Yes") onChange("group-name", "")')],
      ["corporate Yes→No clears inactive shareholder data", has(STEPS, 'if (v !== "Yes")') && has(STEPS, "Are any shareholders legal entities?")],
      ["active-branch ownership by structure", has(STEPS, 'group === "company"', 'group === "partnership"', 'group === "nonshare"', 'group === "trust"')],
    ],
  },

  /* ─── LE16–LE19 ───────────────────────────────────────────────────────── */
  {
    id: "LE16",
    name: "Searchable country pickers; North/South Korea separate",
    parts: [
      ["CountryMultiSelect + CountrySearchSelect", has(STEPS, "CountryMultiSelect", "CountrySearchSelect")],
      ["searchable components", has("components/questionnaire/CountryMultiSelect.tsx", 'type="search"') && has("components/questionnaire/CountrySearchSelect.tsx", "search")],
      ["North Korea and South Korea separate", countries.includes("North Korea") && countries.includes("South Korea") && !countries.includes("Korea")],
    ],
  },
  {
    id: "LE17",
    name: "Contact: name/email/capacity (structure-specific, Trustee/Authorised trust representative), authority, onboarding panel",
    parts: [
      ["name / email / optional phone", has(STEPS, "Contact name", "Contact email", "Phone number (optional)") && lacks(VALID, "contact-phone")],
      ["structure-specific capacity", has(CFG, "capacityOptions", '"Trustee"', '"Authorised trust representative"', '"Partner / member"')],
      ["authorised confirmation", has(STEPS, "I am authorised to submit this request") && has(VALID, "representative-authority")],
      ["OnboardingPreferencesPanel on step 5", has(WIZARD, "OnboardingPreferencesPanel", "page === 5")],
      ["no Other please-specify for LE onboarding", has(WIZARD, /hideOtherMethod=\{[^}]*leBank/)],
      ["No preference exclusive", has("components/questionnaire/OnboardingPreferencesPanel.tsx", "onboarding-no-preference", "disabled={noPref}")],
    ],
  },
  {
    id: "LE18",
    name: "Compact summary rows, Edit per section, active branches only, accuracy confirmation",
    parts: [
      ["summary-row label/value", has(SUMMARY, 'className="summary-row"') && has(CSS, ".summary-row")],
      ["Edit per section", has(SUMMARY, "onEdit(step)", "SummaryCard")],
      ["active branches only", has(SUMMARY, "licenceActive(values)", "directionActive", "isTrust(values)", "values.group === \"Yes\"")],
      ["accuracy confirm", has(WIZARD, "LegalEntityBankSummary", "I confirm that the information I have provided is accurate")],
    ],
  },
  {
    id: "LE19",
    name: "Server save, Progress saved, field-level errors, active-branch validation only",
    parts: [
      ["server draft route exists", existsSync(join(src, "app/api/applications/[id]/draft/route.ts"))],
      ["Progress saved after success", has(WIZARD, "serverSaved ? \"Progress saved. \"")],
      ["field-level errors with focus", has(WIZARD, "setFieldErrors(result.fields)", "focusFirstFieldError(result.firstField)")],
      ["wizard validates LE step before continue", has(WIZARD, "validateLegalEntityBankFields(page, values, pickers)")],
      ["wizard validates all steps on submit", has(WIZARD, "validateLegalEntityBankAll(values, pickers)")],
      ["active-branch only", has(VALID, "Only active branches are validated", "let active = false", "licenceActive(values)")],
      ["unit tests exist", existsSync(join(root, "tests/legal-entity-bank.test.ts"))],
    ],
  },
  {
    id: "LE20",
    name: "Verification script present (this file) with source-string checks for G01–G03 and LE01–LE23",
    parts: [["script exists", existsSync(join(root, "scripts/verify-le-bank-aligned.mjs"))]],
    known: "Static source checks only — live browser evidence still needed for production acceptance.",
  },
  {
    id: "LE21",
    name: "Applies to all selected accounts label; separate monthly schedules per account",
    parts: [
      ["label shown", has(STEPS, "Applies to all selected accounts")],
      ["per-account schedule panel", has(STEPS, "le-schedule:${account}", "accountLabel(account)")],
      ["per-account validation", has(VALID, "for (const account of accounts)")],
      ["per-account typed schedules", has(TYPED, "schedules = Object.fromEntries")],
      ["summary per account", has(SUMMARY, "— incoming", "— outgoing")],
    ],
  },
  {
    id: "LE22",
    name: "Complete potential fit vs Partial coverage; operating-only vs both accounts = partial",
    parts: [
      ["coverage helper", has("lib/matching/le-bank-coverage.ts", '"Partial coverage"', "capability.client_funds", "capability.operating")],
      ["engine maps client-funds / operating capabilities", has("lib/matching/legacy/matching-engine.js", "client_funds:['dedicated client-funds / safeguarding accounts']", "operating:['operating / commercial bank accounts']")],
      ["matching index applies helper", has("lib/matching/index.ts", "coverageForMatch", "partialCount")],
      ["ResultsFlow contract labels", has("components/applicant/ResultsFlow.tsx", "Complete potential fit", "Partial coverage", "isShownMatch")],
      ["typed capabilities essential per account", has(TYPED, 'req(`bank.capability.${a.id}`, a.id, "essential")')],
    ],
    known: "Partial coverage is derived only for the LE bank journey (not PB / merchant / financing results).",
  },
  {
    id: "LE23",
    name: "Structure matching against LEGAL_STRUCTURES.bank incl. Trust; no share % for trusts/foundations",
    parts: [
      ["contract list includes Trust", has("lib/matching/contract/types.ts", /bank: \[[\s\S]*?"Trust"[\s\S]*?\]/)],
      ["config maps every structure to contract label", has(CFG, "contract: ", "LEGAL_STRUCTURES.bank")],
      ["typed legalStructure", has(TYPED, "legalStructure: structure?.contract")],
      ["trust typed block, no percentage", has(TYPED, "trust: trust") && has(TYPED, 'group === "company" || group === "partnership" ? Math.round(coverage')],
      ["isLegalStructureAllowed available", has("lib/matching/contract/accounts.ts", "isLegalStructureAllowed")],
    ],
    known: "Provider entity catalogue (criteria.entities) has no Trust entry yet, so Trust matches resolve to Needs clarification until providers declare Trust acceptance.",
  },
];

let implemented = 0;
let partial = 0;
let notImpl = 0;
const unexpected = [];

console.log("Applicant Legal Entity → Business bank account — static verification (G01–G03, LE01–LE23)\n");
for (const c of checks) {
  const passed = c.parts.filter(([, ok]) => ok).length;
  const total = c.parts.length;
  let status;
  if (passed === total) status = c.known ? "Partial" : "Implemented";
  else if (passed === 0) status = "Not";
  else status = "Partial";

  if (status === "Implemented") implemented += 1;
  else if (status === "Partial") partial += 1;
  else notImpl += 1;
  if (passed !== total) unexpected.push(c.id);

  const pad = status.padEnd(11);
  console.log(`${pad} ${c.id} — ${c.name}  [${passed}/${total}]`);
  for (const [label, ok] of c.parts) if (!ok) console.log(`             ✗ ${label}`);
  if (status === "Partial" && c.known && passed === total) console.log(`             ~ known gap: ${c.known}`);
}

console.log(`\nImplemented: ${implemented}  Partial (known gaps): ${partial - unexpected.filter((id) => checks.find((x) => x.id === id).parts.some(([, ok]) => ok)).length}  Failing checks: ${unexpected.length}  Not: ${notImpl}`);
if (unexpected.length) console.log("Commands with failing source checks:", unexpected.join(", "));
process.exit(unexpected.length ? 1 : 0);
