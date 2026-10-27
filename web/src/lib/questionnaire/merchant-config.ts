/** Applicant merchant / combined options aligned with MC01–MC23 and MB01–MB06. */

import { INDUSTRIES as PROVIDER_INDUSTRIES, PAYMENT_ROUTES } from "@/lib/provider-apply/config";
import { PB_AMOUNT_BANDS, PB_COUNT_BANDS } from "@/lib/questionnaire/private-banking-config";

export { PB_AMOUNT_BANDS, PB_COUNT_BANDS };

/* ─── Entity scope (MC01) ─────────────────────────────────────────────────── */

export const MERCHANT_ENTITY_TYPES = [
  "Private limited company (Ltd / LLC or equivalent)",
  "Association",
] as const;

export type MerchantEntityType = (typeof MERCHANT_ENTITY_TYPES)[number];

export function isMerchantEntityTypeAllowed(value: string): boolean {
  return (MERCHANT_ENTITY_TYPES as readonly string[]).includes(value);
}

/* ─── Industries (MC02) — provider catalogue with Other last ──────────────── */

/** Same labels as provider-apply INDUSTRIES; Adult before Other so Other is last. */
export const INDUSTRIES = [
  ...PROVIDER_INDUSTRIES.filter((i) => i !== "Other" && i !== "Adult industry"),
  "Adult industry",
  "Other",
] as const;

export const MERCHANT_INDUSTRIES = INDUSTRIES;

/* ─── Website & offices (MC02) ────────────────────────────────────────────── */

/** Matches financing values; merchant label uses MC02 “No website not applicable”. */
export const MERCHANT_WEBSITE_STATUS = [
  { value: "available", label: "Website available" },
  { value: "under_development", label: "Under development" },
  { value: "not_applicable", label: "No website not applicable" },
] as const;

export const MERCHANT_OFFICE_STATUS = [
  { value: "incorporation_country", label: "Offices in incorporation country" },
  { value: "other_countries", label: "Offices in other operating countries" },
  { value: "no_physical_offices", label: "No physical offices" },
] as const;

/* ─── Licensing (MC03) ────────────────────────────────────────────────────── */

export const MERCHANT_LICENCE_ANSWERS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Not yet confirmed", label: "Not yet confirmed" },
] as const;

/* ─── Channels & integration (MC04–MC05) ───────────────────────────────────── */

export const MERCHANT_CHANNELS = [
  { id: "online", label: "Online payments" },
  { id: "pos", label: "In-person POS" },
] as const;

export const MERCHANT_PLATFORMS = [
  { id: "shopify", label: "Shopify" },
  { id: "woocommerce", label: "WooCommerce" },
  { id: "magento", label: "Magento" },
  { id: "bigcommerce", label: "BigCommerce" },
  { id: "custom", label: "Custom website or app" },
  /** Verified label from MC05 source report — keep as AdopCommerce. */
  { id: "adopcommerce", label: "AdopCommerce" },
  { id: "other", label: "Other" },
  { id: "not_decided", label: "Not decided" },
] as const;

export function platformOtherKey() {
  return "merchant-platform-other";
}

export function isPlatformOther(value: string): boolean {
  return value === "other" || value === "Other";
}

export const MERCHANT_GATEWAY_KEEP = [
  { value: "must_keep", label: "Must keep" },
  { value: "good_to_have", label: "Good to have" },
  { value: "no_preference", label: "No preference" },
  { value: "not_applicable", label: "Not applicable" },
] as const;

/* ─── Sales model & patterns (MC06) ───────────────────────────────────────── */

export const MERCHANT_SALES_ROLE = [
  {
    value: "own",
    label: "Our own sales only",
    helper:
      "Collecting payments for your own company’s sales. Paying customers are your customers, not other sellers.",
  },
  {
    value: "marketplace",
    label: "Other sellers through a marketplace or platform",
    helper:
      "Collecting payments for separate businesses (other sellers), not simply receiving payment from your own customers.",
  },
  {
    value: "both",
    label: "Both",
    helper: "Own sales and payments collected for other sellers through a marketplace or platform.",
  },
] as const;

/** Multi-select payment patterns; MOTO is optional and never selected by default. */
export const MERCHANT_PAY_PATTERNS = [
  { id: "one_off", label: "One-off payments", required: false },
  { id: "recurring", label: "Subscriptions / recurring payments", required: false },
] as const;

export const MERCHANT_MOTO = {
  id: "moto",
  label: "Mail order / telephone order (MOTO)",
  optional: true,
  helper: "Optional explicit requirement only when needed — not selected by default.",
} as const;

export const MERCHANT_FULFILMENT = [
  { value: "immediately", label: "Immediately" },
  { value: "1_7_days", label: "1–7 days" },
  { value: "8_30_days", label: "8–30 days" },
  { value: "more_than_30_days", label: "More than 30 days" },
  { value: "not_yet_known", label: "Not yet known" },
] as const;

export const MERCHANT_FULFILMENT_HELPER =
  "This helps providers understand when you fulfil an order after payment. It is not settlement time.";

/* ─── Method families & named methods (MC10) ──────────────────────────────── */

export const MERCHANT_METHOD_FAMILIES = [
  { id: "card", label: "Card" },
  { id: "digital_wallet", label: "Digital wallet" },
  { id: "account_to_account", label: "Account-to-account/local bank payment" },
  { id: "crypto", label: "Crypto payment" },
] as const;

export type MerchantMethodFamilyId = (typeof MERCHANT_METHOD_FAMILIES)[number]["id"];

export const MERCHANT_NAMED_METHODS: Record<
  MerchantMethodFamilyId,
  ReadonlyArray<{ id: string; label: string }>
> = {
  card: [
    { id: "visa", label: "Visa" },
    { id: "mastercard", label: "Mastercard" },
    { id: "amex", label: "American Express" },
  ],
  digital_wallet: [
    { id: "google_pay", label: "Google Pay" },
    { id: "apple_pay", label: "Apple Pay" },
    { id: "paypal", label: "PayPal" },
  ],
  account_to_account: [
    { id: "sepa_credit", label: "SEPA credit transfer" },
    { id: "sepa_direct_debit", label: "SEPA Direct Debit" },
    { id: "ideal", label: "iDEAL" },
    { id: "bancontact", label: "Bancontact" },
    { id: "sofort", label: "Sofort" },
    { id: "klarna", label: "Klarna" },
    { id: "blik", label: "BLIK" },
    { id: "fps", label: "Faster Payments" },
    { id: "ach", label: "ACH" },
    { id: "other_local", label: "Other local bank payment" },
  ],
  crypto: [
    { id: "btc", label: "Bitcoin (BTC)" },
    { id: "eth", label: "Ether (ETH)" },
    { id: "usdt", label: "Tether (USDT)" },
    { id: "usdc", label: "USD Coin (USDC)" },
    { id: "other_crypto", label: "Other crypto asset" },
  ],
};

export function namedMethodsForFamily(familyId: string) {
  return MERCHANT_NAMED_METHODS[familyId as MerchantMethodFamilyId] ?? [];
}

export function methodFamilyLabel(familyId: string): string {
  return MERCHANT_METHOD_FAMILIES.find((f) => f.id === familyId)?.label ?? familyId;
}

export function namedMethodLabel(familyId: string, methodId: string): string {
  return namedMethodsForFamily(familyId).find((m) => m.id === methodId)?.label ?? methodId;
}

/* ─── Processing currencies (MC10) ────────────────────────────────────────── */

export const MERCHANT_PROCESSING_CURRENCIES = ["EUR", "GBP", "USD"] as const;

export const MERCHANT_PROCESSING_CURRENCY_OTHER = {
  value: "Other",
  label: "Other ISO currency",
  helper:
    "Select a real ISO fiat currency. Crypto assets are not ISO currencies — use the crypto payment method family.",
} as const;

export const MERCHANT_SETTLEMENT_CURRENCIES = ["EUR", "GBP", "USD"] as const;

export const MERCHANT_BANK_CURRENCIES = ["EUR", "GBP", "USD"] as const;

/* ─── Processing history (MC12–MC13) ──────────────────────────────────────── */

export const MERCHANT_HISTORY_STATUS = [
  {
    value: "currently",
    label: "Currently accepts card payments",
  },
  {
    value: "previously",
    label: "Previously accepted card payments but not currently",
  },
  {
    value: "never",
    label: "Has not started card processing",
  },
] as const;

export const MERCHANT_STATEMENT_AVAILABILITY = [
  { value: "six_months_plus", label: "Six months or more" },
  { value: "less_than_six", label: "Less than six months" },
  { value: "none_yet", label: "No processing history yet" },
  { value: "not_available", label: "History not available to share" },
  { value: "not_sure", label: "Not sure or prefer not to answer" },
] as const;

export const MERCHANT_STATEMENT_NOTE =
  "No statements are requested at this stage. Knowing what history is available helps us identify suitable providers.";

/* ─── Settlement (MC15–MC16) ──────────────────────────────────────────────── */

export const MERCHANT_SETTLEMENT_TYPE = [
  { value: "bank", label: "Bank transfer" },
  { value: "crypto", label: "Crypto settlement" },
  { value: "both", label: "Both" },
] as const;

/** Actual receiving rails for destination account readiness (MC16) — reuse provider PAYMENT_ROUTES. */
export const MERCHANT_RECEIVING_RAILS = PAYMENT_ROUTES;

export const MERCHANT_SETTLEMENT_OWN_NAME_ACK =
  "Settlement payments must be made to an account held in the applicant entity’s own legal name. Third-party settlement accounts are not accepted in this application.";

export const MERCHANT_RECEIVING_ACCOUNT_ANSWERS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Not yet confirmed", label: "Not yet confirmed" },
] as const;

export function receivingRailsForCurrency(code: string) {
  return MERCHANT_RECEIVING_RAILS.filter((r) => r.currency === code);
}

/* ─── PCI (MC11) — optional if known; no universal Level 1–4 claim ─────────── */

/**
 * Optional self-reported PCI posture. Payment brands/acquirers determine
 * programme levels; these options do not claim Levels 1–4 certification.
 */
export const MERCHANT_PCI_STATUS = [
  {
    value: "not_known",
    label: "Not known / prefer not to say",
  },
  {
    value: "working_with_acquirer",
    label: "Working with an acquirer or compliance programme (details not confirmed here)",
  },
  {
    value: "self_assessment_if_known",
    label: "Self-assessment completed (if known) — not a verified certification claim",
  },
  {
    value: "externally_validated_if_known",
    label: "Externally validated under an acquirer-led programme (if known)",
  },
] as const;

export const MERCHANT_PCI_HELPER =
  "Optional if known. Do not upload PCI documents or cardholder data. Programme levels are set by the relevant payment brand or acquirer — this is not a Level 1–4 certification selector.";

/* ─── Market schedule types & helpers (MC07–MC11) ──────────────────────────── */

export type MerchantCurrencyLine = {
  currency: string;
  monthlyValue?: string;
  monthlyCount?: string;
  unknown?: boolean;
};

export type MerchantMethodLine = {
  family: string;
  method: string;
  sharePercent: string;
  currencies: MerchantCurrencyLine[];
};

export type MerchantMarketRow = {
  id: string;
  kind: "country" | "region";
  name: string;
  sharePercent: string;
  methods: MerchantMethodLine[];
};

export const marketsKey = "merchant-markets";

export function parseMarkets(values: Record<string, unknown> | string | null | undefined): MerchantMarketRow[] {
  const raw =
    typeof values === "string" || values == null
      ? values
      : (values[marketsKey] as string | undefined);
  if (Array.isArray(raw)) return raw as MerchantMarketRow[];
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MerchantMarketRow[]) : [];
  } catch {
    return [];
  }
}

export function serializeMarkets(rows: MerchantMarketRow[]): string {
  return JSON.stringify(rows);
}

/**
 * Derive average transaction value from comparable monthly value and count (MC11).
 * Returns null when inputs are missing, unknown, or count is zero.
 */
export function deriveAverage(
  value: string | number | null | undefined,
  count: string | number | null | undefined
): number | null {
  const v = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, "").trim());
  const c = typeof count === "number" ? count : Number(String(count ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(v) || !Number.isFinite(c) || c <= 0) return null;
  return v / c;
}

/** At most 0.01 percentage-point rounding tolerance for share totals (MC08 / M09). */
export const MERCHANT_SHARE_TOLERANCE = 0.01;

/* ─── Regions for market schedule (MC09) ──────────────────────────────────── */

/**
 * Regional estimate labels for the market schedule.
 * Blocked processing countries are excluded via the platform country policy —
 * a region choice must not reintroduce excluded markets.
 */
export const REGIONS = [
  "European Union (EU)",
  "United Kingdom",
  "United States",
  "Canada",
  "Latin America & Caribbean",
  "Other Europe",
  "Middle East",
  "Asia (excluding Middle East)",
  "Africa",
  "Oceania",
] as const;

export const MERCHANT_REGIONS = REGIONS;

export const MERCHANT_REGIONS_NOTE =
  "Regions include only markets currently supported under the platform policy. Blocked countries are excluded via country policy and are not selectable as processing markets.";

/* ─── Chargeback month helpers (MC13) ─────────────────────────────────────── */

/** Last six completed calendar months as `YYYY-MM` (most recent first). */
export function lastSixCompletedMonths(reference = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(reference.getFullYear(), reference.getMonth(), 1));
  // Move to the first day of the previous (completed) month.
  d.setUTCMonth(d.getUTCMonth() - 1);
  for (let i = 0; i < 6; i++) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out;
}

export function chargebackCountKey(ym: string) {
  return `merchant-cb-count:${ym}`;
}

export function chargebackRatioKey(ym: string) {
  return `merchant-cb-ratio:${ym}`;
}

export function chargebackUnavailableKey(ym: string) {
  return `merchant-cb-unavailable:${ym}`;
}

export function formatChargebackMonthLabel(ym: string): string {
  const [ys, ms] = ym.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ─── Bank assistance (MC17 / MB01–MB02) ──────────────────────────────────── */

export const MERCHANT_FIND_BANK_KEY = "find-bank";

export const MERCHANT_BANK_ASSIST_LABEL = "I also need a bank account";

export const MERCHANT_FIND_BANK_ANSWERS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
] as const;

export const MERCHANT_BANK_ASSIST_INCLUDED = "Bank account request included";

export const MERCHANT_BANK_ASSIST_REMOVE = "Remove bank account request";

/* ─── Combined bank account types & currencies (LE06–LE09 / MB03–MB04) ───── */

export const MERCHANT_BANK_ACCOUNT_TYPES = [
  {
    id: "operating",
    label: "Operating / commercial bank account",
    matchLabel: "Operating / commercial bank accounts",
  },
  {
    id: "client_funds",
    label: "Dedicated client-funds / safeguarding account",
    matchLabel: "Dedicated client-funds / safeguarding accounts",
  },
] as const;

/** Must-have / Good to have — same stored values as private banking. */
export const MERCHANT_PRIORITY_LEVELS = [
  { value: "required", label: "Must-have" },
  { value: "preferred", label: "Good to have" },
] as const;

export function bankAcctKey(id: string) {
  return `bank-acct:${id}`;
}

export function bankCurrKey(code: string) {
  return `bank-curr:${code}`;
}

export function bankCurrLevelKey(code: string) {
  return `bank-curr-level:${code}`;
}

export function bankRailKey(id: string) {
  return `bank-rail:${id}`;
}

export function bankRailsForCurrency(code: string) {
  return PAYMENT_ROUTES.filter((r) => r.currency === code);
}

/**
 * LE09 count bands for combined bank activity (MB04).
 * Reuses PB band spans with No activity / Not yet known as distinct states.
 */
export const MERCHANT_BANK_COUNT_BANDS = [
  "No activity",
  "Not yet known",
  "1 to 10",
  "11 to 50",
  "51 to 100",
  "Over 100",
] as const;

/**
 * LE09 amount bands for combined bank activity (MB04).
 * Currency-agnostic wording; pair with the selected account currency.
 */
export const MERCHANT_BANK_AMOUNT_BANDS = [
  "No activity",
  "Not yet known",
  "Up to 50,000",
  "Over 50,000 to 200,000",
  "Over 200,000 to 500,000",
  "Over 500,000 to 1 million",
  "Over 1 million",
] as const;

export function bankInCountKey(accountId: string, code: string) {
  return `bank-in-count:${accountId}:${code}`;
}

export function bankInAmountKey(accountId: string, code: string) {
  return `bank-in-amount:${accountId}:${code}`;
}

export function bankOutCountKey(accountId: string, code: string) {
  return `bank-out-count:${accountId}:${code}`;
}

export function bankOutAmountKey(accountId: string, code: string) {
  return `bank-out-amount:${accountId}:${code}`;
}

export function isInactiveBankActivity(value: unknown): boolean {
  return value === "No activity";
}

export function isUnknownBankActivity(value: unknown): boolean {
  return value === "Not yet known";
}

/* ─── Contact capacities (MC20) ───────────────────────────────────────────── */

export const CONTACT_CAPACITIES = [
  "Director",
  "Employee",
  "Shareholder",
  "External lawyer",
  "External accountant",
  "Association representative/officer",
  "Other",
] as const;

export const MERCHANT_CONTACT_CAPACITIES = CONTACT_CAPACITIES;

/* ─── Step ids (MC01 / MB01) ──────────────────────────────────────────────── */

export const MERCHANT_STEP_IDS = [
  "entity",
  "business_activity",
  "payment_channels",
  "markets_volumes",
  "processing_history",
  "pricing_requirements",
  "settlement",
  "bank_requirements",
  "ownership",
  "contact_onboarding",
  "review",
] as const;

export type MerchantStepId = (typeof MERCHANT_STEP_IDS)[number];

export const MERCHANT_STEP_LABELS: Record<MerchantStepId, string> = {
  entity: "Entity details",
  business_activity: "Business activity",
  payment_channels: "Payment channels and integration",
  markets_volumes: "Customer markets and processing volumes",
  processing_history: "Processing history",
  pricing_requirements: "Pricing and additional requirements",
  settlement: "Settlement",
  bank_requirements: "Bank account requirements",
  ownership: "Ownership and control",
  contact_onboarding: "Contact and onboarding",
  review: "Review",
};

/** Merchant-only navigation — Existing banking removed (MC18); bank step only when combined. */
export function merchantStepOrder(includeBank: boolean): MerchantStepId[] {
  return MERCHANT_STEP_IDS.filter((id) => includeBank || id !== "bank_requirements");
}

export function channelKey(id: string) {
  return `merchant-channel:${id}`;
}

export function payPatternKey(id: string) {
  return `merchant-pay-pattern:${id}`;
}

export function processingCurrencyKey(code: string) {
  return `merchant-proc-curr:${code}`;
}

export function settlementCurrencyKey(code: string) {
  return `merchant-settle-curr:${code}`;
}

export function settlementTypeKey() {
  return "merchant-settlement-type";
}

export function salesRoleKey() {
  return "sales-role";
}

export function newMarketRowId() {
  return `mkt-${Math.random().toString(36).slice(2, 10)}`;
}
