/**
 * Applicant Legal Entity → Business bank account options (LE01–LE23, G01–G03).
 * Mirrors private-banking-config.ts: option catalogues + stable value-key helpers.
 */

import { EU, INDUSTRIES as PROVIDER_INDUSTRIES, PAYMENT_ROUTES } from "@/lib/provider-apply/config";
import { BANK_RAILS, LEGAL_STRUCTURES, MAIN_FIAT_CURRENCIES } from "@/lib/matching/contract/types";
import type { QuestionnaireValues } from "./types";

/* ─── Journey (LE01) ─────────────────────────────────────────────────────── */

/** Applicant step numbers used by the bank journey, in order. */
export const LE_BANK_STEPS = [1, 2, 3, 39, 4, 5] as const;

export const LE_BANK_STEP_LABELS: Record<number, string> = {
  1: "Entity details",
  2: "Business activity",
  3: "Account and flows",
  39: "Existing banking",
  4: "Ownership and control",
  5: "Contact and onboarding",
  40: "Review",
};

export const LE_BANK_STEP_EYEBROWS: Record<number, string> = {
  1: "LEGAL ENTITY · BUSINESS BANK ACCOUNT",
  2: "BUSINESS ACTIVITY",
  3: "ACCOUNT AND FLOWS",
  39: "EXISTING BANKING",
  4: "OWNERSHIP AND CONTROL",
  5: "CONTACT AND ONBOARDING",
  40: "REVIEW",
};

/* ─── Legal structures (LE01 / LE23) ─────────────────────────────────────── */

export type LeOwnershipGroup = "company" | "partnership" | "nonshare" | "trust";

export const LE_STRUCTURES: ReadonlyArray<{
  id: string;
  label: string;
  group: LeOwnershipGroup;
  /** Label in matching/contract LEGAL_STRUCTURES.bank */
  contract: (typeof LEGAL_STRUCTURES.bank)[number];
  /** Label in the matching-engine entity catalogue (criteria.entities); Trust has none. */
  match: string;
}> = [
  { id: "private_company", label: "Private limited company", group: "company", contract: "Private limited company", match: "Private limited company (Ltd / LLC or equivalent)" },
  { id: "public_company", label: "Public limited company", group: "company", contract: "Public company", match: "Public limited company (PLC or equivalent)" },
  { id: "partnership", label: "Partnership", group: "partnership", contract: "Partnership", match: "Partnership" },
  { id: "llp", label: "Limited liability partnership (LLP)", group: "partnership", contract: "LLP", match: "Limited liability partnership (LLP)" },
  { id: "foundation", label: "Foundation", group: "nonshare", contract: "Foundation", match: "Foundation" },
  { id: "association", label: "Association", group: "nonshare", contract: "Association", match: "Association" },
  { id: "trust", label: "Trust", group: "trust", contract: "Trust", match: "Trust" },
  { id: "other", label: "Other", group: "nonshare", contract: "Other", match: "Other legal entity" },
];

export const LE_STRUCTURE_LABELS = LE_STRUCTURES.map((s) => s.label);

export function structureByLabel(label: unknown) {
  const t = String(label ?? "").trim();
  return LE_STRUCTURES.find((s) => s.label === t);
}

export function ownershipGroup(values: QuestionnaireValues): LeOwnershipGroup | null {
  return structureByLabel(values["entity-type"])?.group ?? null;
}

export function isTrust(values: QuestionnaireValues): boolean {
  return structureByLabel(values["entity-type"])?.id === "trust";
}

export function isPublicCompany(values: QuestionnaireValues): boolean {
  return structureByLabel(values["entity-type"])?.id === "public_company";
}

/* ─── Website & activity (LE02) ──────────────────────────────────────────── */

export const LE_WEBSITE_STATUS = [
  { value: "available", label: "Website available" },
  { value: "under_development", label: "Under development" },
  { value: "not_applicable", label: "No website not applicable" },
] as const;

/** Reject blank / single-letter / repeated-character filler text. */
export function isMeaningfulText(text: unknown, minLength = 3): boolean {
  const t = String(text ?? "").trim();
  if (t.length < minLength) return false;
  if (/^(.)\1*$/.test(t)) return false;
  if (!/[\p{L}]{2,}/u.test(t)) return false;
  if (/^(n\/?a|none|nil|test|asdf+|xxx+|qwerty|tbc|tbd|-+|\.+)$/i.test(t)) return false;
  return true;
}

export const LE_ACTIVITY_MIN_LENGTH = 15;

/* ─── Industry (LE03) — shared provider catalogue, Other last ────────────── */

export const LE_INDUSTRIES = [
  ...PROVIDER_INDUSTRIES.filter((i) => i !== "Other" && i !== "Adult industry"),
  "Adult industry",
  "Other",
] as const;

/* ─── Licensing (LE04) ───────────────────────────────────────────────────── */

const INDUSTRY_FOREX = "Forex brokerage & CFD dealing";
const INDUSTRY_GAMBLING = "Gambling & betting — real-money wagering";
const INDUSTRY_CRYPTO = "Crypto-asset services — exchange, custody or brokerage";
const INDUSTRY_FINANCIAL = "Financial services & fintech";
const INDUSTRY_HOLDING = "Holding & investment companies";

/** Licence fields are shown immediately for these industries. */
export const LE_IMMEDIATE_LICENCE_INDUSTRIES = [
  INDUSTRY_FOREX,
  INDUSTRY_GAMBLING,
  INDUSTRY_CRYPTO,
  INDUSTRY_FINANCIAL,
  INDUSTRY_HOLDING,
] as const;

export const LE_LICENCE_ANSWERS = ["Yes", "No", "Not yet confirmed"] as const;

export function licenceImmediate(values: QuestionnaireValues): boolean {
  return (LE_IMMEDIATE_LICENCE_INDUSTRIES as readonly string[]).includes(String(values.industry ?? ""));
}

/** True when licence name/reference/authority/jurisdiction must be collected. */
export function licenceActive(values: QuestionnaireValues): boolean {
  if (!String(values.industry ?? "").trim()) return false;
  return licenceImmediate(values) || values.licence === "Yes";
}

/** EU payment agent: gambling/betting or forex/CFD only, incorporation AND licensing outside the EU. */
export function euAgentApplicable(values: QuestionnaireValues): boolean {
  const industry = String(values.industry ?? "");
  if (industry !== INDUSTRY_GAMBLING && industry !== INDUSTRY_FOREX) return false;
  const inc = String(values.incorporation ?? "").trim();
  const lic = String(values["licence-jurisdiction"] ?? "").trim();
  if (!inc || !lic) return false;
  return !EU.includes(inc) && !EU.includes(lic);
}

export const LE_EMPLOYEE_BANDS = ["0", "1–5", "6–25", "More than 25"] as const;

/* ─── Offices (LE05) ─────────────────────────────────────────────────────── */

export const LE_OFFICE_MODES = [
  { value: "incorporation", label: "In country of incorporation", trustLabel: "In the country where the trust is administered (governing-law country)" },
  { value: "other", label: "In other operating countries", trustLabel: "In other countries where the trust is administered or operated" },
  { value: "none", label: "No physical offices", trustLabel: "No physical administration or operating office" },
] as const;

/* ─── Account types (LE06) ───────────────────────────────────────────────── */

export const LE_ACCOUNTS = [
  { id: "operating", label: "Operating account", matchLabel: "Operating / commercial bank accounts" },
  { id: "client_funds", label: "Dedicated client-funds account", matchLabel: "Dedicated client-funds / safeguarding accounts" },
] as const;

export type LeAccountId = (typeof LE_ACCOUNTS)[number]["id"];

export function accountLabel(id: string): string {
  return LE_ACCOUNTS.find((a) => a.id === id)?.label ?? id;
}

/* ─── Purposes (LE07) ────────────────────────────────────────────────────── */

export const LE_PURPOSES = [
  { id: "operations", label: "Support business operations", matchLabel: "Support operational activities — customer receipts and business payments" },
  { id: "diversify", label: "Diversify funds across institutions", matchLabel: "Diversify assets across financial institutions" },
  { id: "facility", label: "Access a specific banking facility", matchLabel: null },
  { id: "rates", label: "Obtain better rates or pricing", matchLabel: null },
  { id: "service", label: "Obtain better service", matchLabel: null },
  { id: "reserve", label: "Maintain a reserve account", matchLabel: "Establish a backup or reserve account" },
  { id: "other", label: "Other", matchLabel: null },
] as const;

/** Additional services kept with Must-have / Good to have (LE07 — other legacy facilities removed). */
export const LE_SERVICES = [
  { id: "cards", label: "Corporate cards", matchLabel: "Corporate cards" },
  { id: "fx", label: "Foreign exchange (FX)", matchLabel: "Currency exchange (FX)" },
  { id: "term_deposit", label: "Fixed-term deposits", matchLabel: "Fixed-term deposits" },
] as const;

/* ─── Currencies & rails (LE08) ──────────────────────────────────────────── */

/** EUR / GBP / USD only — Swiss franc is no longer offered (G02). */
export const LE_CURRENCIES = MAIN_FIAT_CURRENCIES;

const RAIL_SHORT_LABELS: Record<string, string> = {
  eur_sepa: BANK_RAILS.EUR[0],
  eur_sepa_instant: BANK_RAILS.EUR[1],
  eur_swift: BANK_RAILS.EUR[2],
  eur_target: "TARGET/T2",
  gbp_fps: BANK_RAILS.GBP[0],
  gbp_chaps: BANK_RAILS.GBP[1],
  gbp_swift: BANK_RAILS.GBP[2],
  usd_ach: BANK_RAILS.USD[0],
  usd_fedwire: BANK_RAILS.USD[1],
  usd_swift: BANK_RAILS.USD[2],
};

/** Rail catalogue (routing numbers are not a rail — LE08). Ids follow PAYMENT_ROUTES. */
export const LE_RAILS = PAYMENT_ROUTES.filter((r) => (LE_CURRENCIES as readonly string[]).includes(r.currency)).map(
  (r) => ({ id: r.id, currency: r.currency, label: RAIL_SHORT_LABELS[r.id] ?? r.label, fullLabel: r.label })
);

export function railsForCurrency(code: string) {
  return LE_RAILS.filter((r) => r.currency === code);
}

/* ─── Monthly estimates (LE09) ───────────────────────────────────────────── */

export const LE_COUNT_BANDS = [
  { id: "1-10", label: "1–10" },
  { id: "11-50", label: "11–50" },
  { id: "51-100", label: "51–100" },
  { id: "over-100", label: "Over 100" },
  { id: "none", label: "No activity" },
  { id: "unknown", label: "Not yet known" },
] as const;

export const LE_AMOUNT_BANDS = [
  { id: "0-50k", label: "Up to 50k" },
  { id: "50k-200k", label: "Over 50k–200k" },
  { id: "200k-500k", label: "Over 200k–500k" },
  { id: "500k-1m", label: "Over 500k–1m" },
  { id: "over-1m", label: "Over 1m" },
  { id: "none", label: "No activity" },
  { id: "unknown", label: "Not yet known" },
] as const;

export function bandLabel(bands: ReadonlyArray<{ id: string; label: string }>, id: string): string {
  return bands.find((b) => b.id === id)?.label ?? id;
}

/** Separate incoming vs outgoing purpose lists (LE09). `client` items apply to client-funds accounts only. */
export const LE_INCOMING_PURPOSES = [
  { id: "customer_receipts", label: "Customer payments for goods or services" },
  { id: "intercompany", label: "Intercompany / group transfers" },
  { id: "investor_funding", label: "Investor or shareholder funding" },
  { id: "loans", label: "Loan or financing proceeds" },
  { id: "investment_income", label: "Investment income / dividends" },
  { id: "own_accounts", label: "Transfers from own accounts" },
  { id: "client_funds_in", label: "Client funds received on behalf of clients", client: true },
  { id: "other", label: "Other" },
] as const;

export const LE_OUTGOING_PURPOSES = [
  { id: "suppliers", label: "Payments to suppliers / service providers" },
  { id: "payroll", label: "Salaries and staff costs" },
  { id: "tax", label: "Tax and regulatory payments" },
  { id: "intercompany", label: "Intercompany / group transfers" },
  { id: "distributions", label: "Dividends / shareholder distributions" },
  { id: "investment", label: "Investment payments" },
  { id: "own_accounts", label: "Transfers to own accounts" },
  { id: "client_payouts", label: "Payouts or settlements to clients", client: true },
  { id: "other", label: "Other" },
] as const;

export type LeDirection = "in" | "out";

export function flowPurposes(dir: LeDirection, account: string) {
  const list = dir === "in" ? LE_INCOMING_PURPOSES : LE_OUTGOING_PURPOSES;
  return list.filter((p) => !("client" in p && p.client) || account === "client_funds");
}

/* ─── Existing banking (LE10) ────────────────────────────────────────────── */

export const LE_EXISTING_BANKING = [
  { value: "present", label: "Yes, the entity currently holds a business bank account" },
  { value: "absent", label: "No, the entity has no existing business bank account" },
  { value: "closed", label: "A previous bank account was closed" },
] as const;

/* ─── Ownership (LE11–LE15) ──────────────────────────────────────────────── */

export const LE_MIN_COVERAGE = 75;
export const LE_MAX_ROWS = 10;

export const LE_NONSHARE_ROLES = [
  "Founder",
  "Council / board member",
  "Director / governing officer",
  "Beneficiary",
  "Other control",
] as const;

export const LE_TRUST_ROLES = ["Settlor", "Trustee", "Protector", "Beneficiary", "Beneficiary class", "Other control"] as const;

export const LE_PARTNER_ROUTES = [
  { value: "percentage", label: "Declare partner interests as percentages" },
  { value: "control", label: "Describe control instead (no fixed percentage interests)" },
] as const;

/** Row-prefix for the active ownership group's person rows. */
export function personPrefix(group: LeOwnershipGroup | null): "bo" | "partner" | "role" | "trust" {
  switch (group) {
    case "partnership":
      return "partner";
    case "nonshare":
      return "role";
    case "trust":
      return "trust";
    default:
      return "bo";
  }
}

/* ─── Contact (LE17) ─────────────────────────────────────────────────────── */

const BASE_CAPACITIES = [
  "Director / officer",
  "Employee",
  "External lawyer",
  "External accountant",
  "External corporate-services provider",
  "Other authorised representative",
];

export function capacityOptions(group: LeOwnershipGroup | null): string[] {
  switch (group) {
    case "partnership":
      return ["Partner / member", ...BASE_CAPACITIES];
    case "nonshare":
      return ["Council / board member", ...BASE_CAPACITIES];
    case "trust":
      return ["Trustee", "Authorised trust representative", "Protector", ...BASE_CAPACITIES.slice(1)];
    default:
      return ["Shareholder / beneficial owner", ...BASE_CAPACITIES];
  }
}

export function capacityNeedsFirm(role: string): boolean {
  return role.includes("External") || role.includes("Other authorised") || role === "Authorised trust representative";
}

/* ─── Key helpers (le-acct:, le-curr:, le-rail:, …) ──────────────────────── */

export function leAcctKey(id: string) {
  return `le-acct:${id}`;
}
export function lePurposeKey(id: string) {
  return `le-purpose:${id}`;
}
export function leSvcKey(id: string) {
  return `le-svc:${id}`;
}
export function leSvcLevelKey(id: string) {
  return `le-svc-level:${id}`;
}
export function leCurrKey(code: string) {
  return `le-curr:${code}`;
}
export function leCurrLevelKey(code: string) {
  return `le-curr-level:${code}`;
}
export function leRailKey(id: string) {
  return `le-rail:${id}`;
}
export function leCountKey(dir: LeDirection, account: string, code: string) {
  return `le-${dir}-count:${account}:${code}`;
}
export function leAmountKey(dir: LeDirection, account: string, code: string) {
  return `le-${dir}-amount:${account}:${code}`;
}
/** Country picker id (stored in pickers). */
export function leCountriesId(dir: LeDirection, account: string) {
  return `le-${dir}-countries:${account}`;
}
export function leCountriesUnknownKey(dir: LeDirection, account: string) {
  return `le-${dir}-countries-unknown:${account}`;
}
export function leFlowPurposeKey(dir: LeDirection, account: string, id: string) {
  return `le-${dir}-purpose:${account}:${id}`;
}
export function leFlowPurposeOtherKey(dir: LeDirection, account: string) {
  return `le-${dir}-purpose-other:${account}`;
}
export function leCorpJurKey(i: number) {
  return `le-corp-jur:${i}`;
}
export function leCorpPctKey(i: number) {
  return `le-corp-pct:${i}`;
}
export function lePersonKey(prefix: string, field: "pct" | "role" | "res" | "desc", i: number) {
  return `le-${prefix}-${field}:${i}`;
}
/** Nationality picker id for a person row. */
export function lePersonNatId(prefix: string, i: number) {
  return `le-${prefix}-nat:${i}`;
}
export function lePersonCountKey(prefix: string) {
  return `le-${prefix}-count`;
}

/* ─── Value readers shared by steps, summary, validation, typed data ─────── */

export function selectedAccounts(values: QuestionnaireValues): LeAccountId[] {
  return LE_ACCOUNTS.filter((a) => values[leAcctKey(a.id)] === true).map((a) => a.id);
}

export function selectedCurrencies(values: QuestionnaireValues): string[] {
  return (LE_CURRENCIES as readonly string[]).filter((c) => values[leCurrKey(c)] === true);
}

export function rowCount(values: QuestionnaireValues, key: string): number {
  const n = Number(values[key]);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), LE_MAX_ROWS) : 0;
}

/** A direction is active unless every selected currency is "No activity" for both count and amount. */
export function directionActive(
  values: QuestionnaireValues,
  dir: LeDirection,
  account: string,
  currencies: string[]
): boolean {
  if (!currencies.length) return true;
  return currencies.some((code) => {
    const count = String(values[leCountKey(dir, account, code)] ?? "");
    const amount = String(values[leAmountKey(dir, account, code)] ?? "");
    return count !== "none" || amount !== "none";
  });
}

export function priorityOf(value: unknown): "essential" | "preferred" {
  return value === "required" ? "essential" : "preferred";
}

export function levelLabel(value: unknown): string {
  return value === "required" ? "Must-have" : "Good to have";
}

/** Matching-rule explanation shown with every Must-have / Good to have toggle (G03). */
export const LE_PRIORITY_EXPLANATION =
  "A missing Must-have excludes a provider option; a missing Good to have does not — it only affects how well the option fits.";

/** Legacy → current priority label (G03). */
export function mapLegacyPriorityLabel(value: unknown): "Must-have" | "Good to have" {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "required" || v === "must-have" || v === "essential") return "Must-have";
  return "Good to have";
}
