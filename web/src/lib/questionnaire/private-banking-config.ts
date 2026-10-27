/** Applicant private-banking options aligned with provider catalogue / matching-engine labels. */

import { PAYMENT_ROUTES } from "@/lib/provider-apply/config";

/** Baseline account is implicit on this route — not a selectable extra. */
export const PB_BASELINE_ACCOUNT = {
  id: "personal",
  matchLabel: "Personal banking accounts",
  label: "Private banking account",
} as const;

/** Additional services beyond the implicit private-banking account. */
export const PB_SERVICES = [
  { id: "term_deposit", matchLabel: "Savings / fixed-term deposits", label: "Savings / fixed-term deposits" },
  { id: "fx", matchLabel: "Foreign exchange (FX)", label: "Foreign exchange (FX)" },
  { id: "advice", matchLabel: "Investment advisory services", label: "Investment advice" },
  { id: "managed_portfolio", matchLabel: "Discretionary portfolio management", label: "Discretionary portfolio management" },
  { id: "custody", matchLabel: "Securities custody", label: "Securities custody" },
  { id: "trading", matchLabel: "Securities trading / execution", label: "Securities trading / execution" },
  { id: "lombard", matchLabel: "Lombard loans / lending against pledged financial assets", label: "Lombard loan — borrowing against pledged financial assets" },
  { id: "cards", matchLabel: "Payment cards", label: "Payment cards" },
  { id: "other", matchLabel: "Other", label: "Other — please specify" },
] as const;

export const PB_ASSET_BANDS = [
  "€50,000 to under €100,000",
  "€100,000 to under €500,000",
  "€500,000 to under €1 million",
  "€1 million to €5 million",
  "Above €5 million",
] as const;

/** Account currencies — EUR / GBP / USD only (PB08 / PB15). */
export const PB_CURRENCIES = ["EUR", "GBP", "USD"] as const;

export const PB_PAYMENT_ROUTES = PAYMENT_ROUTES;

export const PB_LANGUAGES = [
  "English",
  "Greek",
  "French",
  "German",
  "Spanish",
  "Italian",
  "Hebrew",
  "Arabic",
  "Other",
] as const;

export const PB_OCCUPATION = [
  "Business owner / entrepreneur",
  "Employed professional / executive",
  "Self-employed",
  "Investor",
  "Retired",
  "Other",
] as const;

export const PB_WEALTH_SOURCES = [
  { id: "employment", label: "Employment / professional income" },
  { id: "business", label: "Business earnings / dividends" },
  { id: "sale_business", label: "Sale of a business" },
  { id: "investments", label: "Investment returns" },
  { id: "property", label: "Property income / sale" },
  { id: "inheritance", label: "Inheritance" },
  { id: "gifts", label: "Gifts" },
  { id: "other", label: "Other — please specify" },
] as const;

/** @deprecated Removed from active collection (PB04). Kept for historical typed-data reads. */
export const PB_FUND_SOURCES = [
  ...PB_WEALTH_SOURCES,
  { id: "existing_savings", label: "Existing savings / investments" },
] as const;

export const PB_THIRD_PARTY_RELATIONSHIPS = [
  "Employer",
  "My own company",
  "Client/customer",
  "Family member",
  "Other",
  "Not yet known",
] as const;

export const PB_INCOMING_PURPOSES = [
  { id: "employment", label: "Employment income" },
  { id: "professional_fees", label: "Professional services/client fees" },
  { id: "dividends", label: "Business dividends/distributions" },
  { id: "investment_income", label: "Investment income" },
  { id: "property_income", label: "Property income" },
  { id: "family_support", label: "Family support/gifts" },
  { id: "own_accounts", label: "Transfers from own accounts" },
  { id: "other", label: "Other" },
] as const;

export const PB_OUTGOING_PURPOSES = [
  { id: "suppliers", label: "Payments to suppliers/service providers" },
  { id: "living", label: "Personal/living expenses" },
  { id: "family_support", label: "Family support/gifts" },
  { id: "investment", label: "Investment payments" },
  { id: "own_accounts", label: "Transfers to own accounts" },
  { id: "other", label: "Other" },
] as const;

/** Legacy shared purposes — retained for migration reads only. */
export const PB_TRANSFER_PURPOSES = [
  "Employment income",
  "Investment income",
  "Family support",
  "Personal expenses",
  "Transfers between own accounts",
  "Other",
] as const;

export const PB_COUNT_BANDS = ["1 to 10", "11 to 50", "51 to 100", "Over 100"] as const;

export const PB_AMOUNT_BANDS = [
  "Greater than 0 to €50,000",
  "Greater than €50,000 to €200,000",
  "Greater than €200,000 to €500,000",
  "Greater than €500,000 to €1 million",
  "Greater than €1 million",
] as const;

export function svcKey(id: string) {
  return `pb-svc:${id}`;
}

export function svcLevelKey(id: string) {
  return `pb-svc-level:${id}`;
}

export function currKey(code: string) {
  return `pb-curr:${code}`;
}

export function currLevelKey(code: string) {
  return `pb-curr-level:${code}`;
}

export function railKey(id: string) {
  return `pb-rail:${id}`;
}

export function wealthKey(id: string) {
  return `pb-wealth:${id}`;
}

export function fundKey(id: string) {
  return `pb-fund:${id}`;
}

export function purposeKey(label: string) {
  return `pb-purpose:${label}`;
}

export function inPurposeKey(id: string) {
  return `pb-in-purpose:${id}`;
}

export function outPurposeKey(id: string) {
  return `pb-out-purpose:${id}`;
}

export function inCountKey(code: string) {
  return `pb-in-count:${code}`;
}

export function inAmountKey(code: string) {
  return `pb-in-amount:${code}`;
}

export function outCountKey(code: string) {
  return `pb-out-count:${code}`;
}

export function outAmountKey(code: string) {
  return `pb-out-amount:${code}`;
}

export function railsForCurrency(code: string) {
  return PB_PAYMENT_ROUTES.filter((r) => r.currency === code);
}

export function formatAssessmentRoute(route: string): string {
  const map: Record<string, string> = {
    individual: "Individual — Private banking",
    bank: "Legal entity — Business banking",
    merchant: "Legal entity — Merchant services",
    both: "Legal entity — Bank and merchant",
    financing: "Legal entity — Financing",
    institution: "Financial institution — Correspondent",
  };
  return map[route] ?? route;
}
