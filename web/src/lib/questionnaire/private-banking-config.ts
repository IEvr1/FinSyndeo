/** Applicant private-banking options aligned with provider catalogue / matching-engine labels. */

export const PB_SERVICES = [
  { id: "personal", matchLabel: "Personal banking accounts", label: "Personal banking account" },
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

export const PB_CURRENCIES = ["EUR", "GBP", "USD", "CHF", "Other"] as const;

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

export const PB_FUND_SOURCES = [
  ...PB_WEALTH_SOURCES,
  { id: "existing_savings", label: "Existing savings / investments" },
] as const;

export const PB_TRANSFER_PURPOSES = [
  "Employment income",
  "Investment income",
  "Family support",
  "Personal expenses",
  "Transfers between own accounts",
  "Other",
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

export function wealthKey(id: string) {
  return `pb-wealth:${id}`;
}

export function fundKey(id: string) {
  return `pb-fund:${id}`;
}

export function purposeKey(label: string) {
  return `pb-purpose:${label}`;
}
