/** Applicant financing options aligned with shared purpose catalogue / matching. */

export const FINANCE_ENTITY_TYPES = [
  "Private limited company (Ltd / LLC or equivalent)",
  "Partnership",
  "Limited liability partnership (LLP)",
] as const;

export type FinanceEntityType = (typeof FINANCE_ENTITY_TYPES)[number];

/** Shared financing purpose catalogue (FN03). */
export const FINANCE_PURPOSES = [
  {
    key: "working_capital",
    label: "Working capital",
    legacy: ["Working capital"],
  },
  {
    key: "business_expansion",
    label: "Business expansion",
    legacy: ["Business expansion"],
  },
  {
    key: "equipment_asset_purchase",
    label: "Equipment or asset purchase",
    legacy: ["Equipment or asset purchase"],
  },
  {
    key: "property_acquisition_development",
    label: "Property acquisition or development",
    legacy: ["Property acquisition or development"],
  },
  {
    key: "project_finance",
    label: "Project finance",
    legacy: ["Project finance"],
  },
  {
    key: "maritime_vessel_finance",
    label: "Maritime / vessel finance",
    alias: "Shipping finance",
    helper: "Shipping finance, including vessel acquisition",
    legacy: ["Maritime / vessel finance", "Shipping finance"],
  },
  {
    key: "trade_inventory_finance",
    label: "Trade or inventory finance",
    legacy: ["Trade or inventory finance"],
  },
  {
    key: "refinancing",
    label: "Refinancing",
    legacy: ["Refinancing", "Refinancing existing borrowing"],
  },
  {
    key: "business_acquisition",
    label: "Business acquisition",
    legacy: ["Business acquisition"],
  },
  {
    key: "other",
    label: "Other",
    legacy: ["Other"],
  },
] as const;

export const FINANCE_CURRENCIES = ["EUR", "GBP", "USD"] as const;

export const FINANCE_TIMELINES = [
  { value: "as_soon_as_practical", label: "As soon as practical" },
  { value: "within_1_3_months", label: "Within 1-3 months" },
  { value: "within_3_6_months", label: "Within 3-6 months" },
  { value: "within_6_12_months", label: "Within 6-12 months" },
  { value: "specific_date", label: "On a specific date" },
  { value: "not_yet_sure", label: "Not yet sure" },
] as const;

export const FINANCE_WEBSITE_STATUS = [
  { value: "available", label: "Website available" },
  { value: "under_development", label: "Under development" },
  { value: "not_applicable", label: "Not applicable" },
] as const;

export const FINANCE_REVENUE_STATUS = [
  "Generating revenue",
  "Pre-revenue / no revenue yet",
  "Information not yet available",
] as const;

export const FINANCE_AUDIT_AVAILABILITY = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Not yet sure", label: "Not yet sure" },
] as const;

export const FINANCE_BUSINESS_STAGES = [
  "Planning",
  "Feasibility / preparation",
  "Ready to proceed",
  "In progress",
  "Operating / generating revenue",
] as const;

export const FINANCE_PROJECT_STAGES = [
  "Planning",
  "Feasibility / preparation",
  "Ready to proceed",
  "In progress",
  "Operating / completed asset",
] as const;

export const FINANCE_PLEDGE_STATUS = ["Yes", "No", "Partly", "Not sure"] as const;

export const FINANCE_EXISTING_BANKING = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Previously held now closed", label: "Previously held now closed" },
] as const;

export const FINANCE_CURRENCY_CLARIFICATION = "Needs clarification";

/** Purposes that use business stage rather than project/investment stage. */
export const FINANCE_BUSINESS_STAGE_PURPOSES = new Set([
  "working_capital",
  "trade_inventory_finance",
  "refinancing",
]);

/** Purposes that use project / investment / acquisition stage. */
export const FINANCE_PROJECT_STAGE_PURPOSES = new Set([
  "project_finance",
  "property_acquisition_development",
  "equipment_asset_purchase",
  "business_expansion",
  "business_acquisition",
]);

export function isFinanceEntityTypeAllowed(value: string): boolean {
  return (FINANCE_ENTITY_TYPES as readonly string[]).includes(value);
}

export function financePurposeFromValue(raw: string): (typeof FINANCE_PURPOSES)[number] | null {
  const v = raw.trim();
  if (!v) return null;
  for (const p of FINANCE_PURPOSES) {
    if (p.key === v || p.label === v) return p;
    if ("legacy" in p && (p.legacy as readonly string[]).includes(v)) return p;
    if ("alias" in p && p.alias === v) return p;
  }
  return null;
}

export function financePurposeKey(raw: string): string {
  return financePurposeFromValue(raw)?.key ?? "";
}

export function completedFinancialYears(reference = new Date(), count = 5): number[] {
  const year = reference.getFullYear();
  // Preview in Oct 2026 uses 2025..2021; once FY of current calendar year is complete, include it.
  // Without applicant FY end date, treat Jan–Mar as prior year still current, Apr–Dec as prior complete.
  const latestCompleted = reference.getMonth() < 3 ? year - 1 : year - 1;
  return Array.from({ length: count }, (_, i) => latestCompleted - i);
}

export function facilityKey(index: number, field: string) {
  return `finance-facility-${index}-${field}`;
}

export function auditYearKey(year: number) {
  return `finance-audit-year-${year}`;
}

export function isMeaningfulNarrative(text: string, minChars = 8): boolean {
  const t = text.trim();
  if (t.length < minChars) return false;
  if (/^(.)\1+$/i.test(t)) return false;
  const fillers = new Set(["n/a", "na", "none", "test", "asdf", "xxx", "tba", "tbd", "."]);
  if (fillers.has(t.toLowerCase())) return false;
  return true;
}
