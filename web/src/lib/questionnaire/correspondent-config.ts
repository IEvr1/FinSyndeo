/** Correspondent / payment-account applicant options — aligned with Provider Master catalogue. */

import { PAYMENT_ROUTES } from "@/lib/provider-apply/config";

export const CO_INSTITUTION_CATEGORIES = [
  { id: "bank", label: "Bank" },
  { id: "payment_institution", label: "Payment institution" },
  { id: "emi", label: "Electronic money institution" },
  { id: "msb", label: "Money services business" },
  { id: "casp", label: "Crypto asset service provider" },
] as const;

export const CO_REGULATORY_STATUS = [
  "Licensed / authorised",
  "Registered",
  "Pending authorisation",
  "Other",
] as const;

/** Shared additional-services catalogue (applicant + provider). Other is always last. */
export const CO_SERVICES = [
  { id: "api_connectivity", label: "API connectivity", matchLabel: "API connectivity" },
  { id: "bulk_payments", label: "Bulk payments", matchLabel: "Bulk payments" },
  {
    id: "currency_conversion",
    label: "Currency conversion and FX",
    matchLabel: "Currency conversion and FX",
  },
  {
    id: "cross_border_collection_payouts",
    label: "Cross border collection and payouts",
    matchLabel: "Cross border collection and payouts",
  },
  {
    id: "payment_clearing_settlement",
    label: "Payment clearing and settlement",
    matchLabel: "Payment clearing and settlement",
    hint:
      "Clearing checks and reconciles payment instructions; settlement completes the transfer of funds. This does not itself imply direct scheme membership or support for every currency and rail.",
  },
  {
    id: "baas",
    label: "Banking as a Service (BaaS)",
    matchLabel: "Banking as a Service (BaaS)",
    hint:
      "BaaS is not synonymous with a correspondent account and does not automatically include SWIFT, SEPA, cards, White Label, issuing, custody, ramps or safeguarding.",
  },
  { id: "white_label", label: "White Label", matchLabel: "White Label" },
  {
    id: "card_issuing",
    label: "Card issuing",
    matchLabel: "Card issuing",
    hint: "Card issuing is not merchant acquiring.",
  },
  {
    id: "crypto_on_ramp",
    label: "Crypto on ramp (fiat to crypto)",
    matchLabel: "Crypto on ramp (fiat to crypto)",
  },
  {
    id: "crypto_off_ramp",
    label: "Crypto off ramp (crypto to fiat)",
    matchLabel: "Crypto off ramp (crypto to fiat)",
  },
  {
    id: "client_funds_safeguarding",
    label: "Safeguarding of client funds",
    matchLabel: "Safeguarding of client funds",
    hint:
      "Regulatory safeguarding support is separate from segregation or a pooled account. Selecting this requires an explicit dedicated client-funds account.",
  },
  {
    id: "own_funds_fixed_deposits",
    label: "Fixed term deposits (institution own funds)",
    matchLabel: "Fixed term deposits (institution own funds)",
    hint: "Applies to the institution’s own funds only — not safeguarded or other client funds.",
  },
  { id: "other", label: "Other", matchLabel: "Other" },
] as const;

export const CO_ACCOUNT_STRUCTURES = [
  {
    id: "virtual_accounts",
    label: "Dedicated virtual accounts or wallets for clients",
  },
  {
    id: "pooled_omnibus",
    label: "Pooled omnibus account",
  },
] as const;

export const CO_CURRENCIES = ["EUR", "GBP", "USD"] as const;

export const CO_PAYMENT_ROUTES = PAYMENT_ROUTES;

export const CO_CLIENT_TYPES = [
  { id: "individuals", label: "Individuals" },
  { id: "businesses", label: "Businesses" },
  { id: "other_fis", label: "Other financial institutions" },
] as const;

export const CO_REGIONS = [
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

export const CO_COUNT_BANDS = [
  "No activity",
  "Not yet known",
  "1 to 10",
  "11 to 50",
  "51 to 100",
  "Over 100",
] as const;

export const CO_AMOUNT_BANDS = [
  "No activity",
  "Not yet known",
  "Up to 50,000",
  "Over 50,000 to 200,000",
  "Over 200,000 to 500,000",
  "Over 500,000 to 1 million",
  "Over 1 million",
] as const;

export const CO_AMLRO_CHOICES = ["Internal", "External"] as const;

export const CO_RELATIONSHIP_STATUS = [
  "Active",
  "Closing / replacing",
  "Previously held",
  "Other",
] as const;

export const CO_UBO_COVERAGE_TARGET = 75;

export function coSvcKey(id: string) {
  return `co-svc:${id}`;
}

export function coCurrKey(code: string) {
  return `co-curr:${code}`;
}

export function coCurrLevelKey(code: string) {
  return `co-curr-level:${code}`;
}

export function coRailKey(id: string) {
  return `co-rail:${id}`;
}

export function coClientTypeKey(id: string) {
  return `co-client:${id}`;
}

export function coRegionKey(label: string) {
  return `co-region:${label}`;
}

export function coStructKey(id: string) {
  return `co-struct:${id}`;
}

export function railsForCurrency(code: string) {
  return CO_PAYMENT_ROUTES.filter((r) => r.currency === code);
}

export function flowKey(
  scope: "operating" | "client",
  currency: string,
  direction: "in" | "out",
  field: "amount" | "count" | "purpose"
) {
  return `co-flow:${scope}:${currency}:${direction}:${field}`;
}

export function flowCountriesKey(
  scope: "operating" | "client",
  currency: string,
  direction: "in" | "out"
) {
  return `co-flow-countries:${scope}:${currency}:${direction}`;
}

export function isInactiveActivity(value: unknown): boolean {
  return value === "No activity";
}

export function isUnknownActivity(value: unknown): boolean {
  return value === "Not yet known";
}

export function activityDeclared(value: unknown): boolean {
  const s = String(value ?? "").trim();
  return Boolean(s) && s !== "No activity" && s !== "Not yet known";
}

export function websiteUnavailableKey() {
  return "co-website-unavailable";
}

export type CoCorporateShareholder = {
  id: string;
  jurisdiction: string;
  shareholding: string;
};

export type CoUbo = {
  id: string;
  ownership: string;
  nationalities: string[];
  residence: string;
  sameAsNationality: boolean;
};

export type CoExistingProvider = {
  id: string;
  name: string;
  country: string;
  status: string;
};

export function parseJsonList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
