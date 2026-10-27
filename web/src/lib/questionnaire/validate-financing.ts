import {
  FINANCE_CURRENCIES,
  FINANCE_PLEDGE_STATUS,
  FINANCE_REVENUE_STATUS,
  auditYearKey,
  completedFinancialYears,
  facilityKey,
  financePurposeKey,
  isFinanceEntityTypeAllowed,
  isMeaningfulNarrative,
} from "./financing-config";
import type { CountryPickers, QuestionnaireValues } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes" || v === "on";
}

export type FinanceValidationResult = {
  message: string;
  fields: Record<string, string>;
  firstField?: string;
};

function result(fields: Record<string, string>): FinanceValidationResult | null {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const firstField = keys[0];
  const message =
    keys.length === 1
      ? fields[firstField]
      : `Please complete ${keys.length} required items below. First: ${fields[firstField]}`;
  return { message, fields, firstField };
}

export function validateFinancingEntityStep(values: QuestionnaireValues): FinanceValidationResult | null {
  const fields: Record<string, string> = {};
  if (!str(values["company-name"])) fields["company-name"] = "Please enter the registered entity name.";
  if (!str(values.incorporation)) fields.incorporation = "Please select the incorporation jurisdiction.";
  if (!str(values.registration) && !bool(values["registration-notissued"])) {
    fields.registration = "Please enter the registration identifier or mark the exception.";
  }
  if (bool(values["registration-notissued"]) && !str(values["registration-exception-reason"])) {
    fields["registration-exception-reason"] = "Please explain the identifier exception.";
  }
  const entityType = str(values["entity-type"]);
  if (!entityType) {
    fields["entity-type"] = "Please select the legal entity type.";
  } else if (!isFinanceEntityTypeAllowed(entityType)) {
    fields["entity-type"] =
      "This financing route supports only private limited companies, partnerships and LLPs. This draft is outside the current financing scope.";
  }
  return result(fields);
}

export function validateFinancingBusinessStep(values: QuestionnaireValues): FinanceValidationResult | null {
  const fields: Record<string, string> = {};
  if (!str(values.industry)) fields.industry = "Please select an industry category.";
  if (!isMeaningfulNarrative(str(values.activity), 12)) {
    fields.activity = "Please describe the company's products/services, customers and revenue model.";
  }
  const websiteStatus = str(values["finance-website-status"] || values["website-status"]);
  if (!websiteStatus) {
    fields["finance-website-status"] = "Please indicate whether a company website is available.";
  } else if (websiteStatus === "available") {
    const url = str(values.website);
    if (!url || !/^https?:\/\/\S+\.\S+/i.test(url)) {
      fields.website = "Please enter a valid website URL.";
    }
  }
  const licence = str(values.licence);
  if (!licence) {
    fields.licence = "Please indicate whether a licence or authorisation is required.";
  } else if (licence === "Yes") {
    if (!str(values["finance-licence-name"])) {
      fields["finance-licence-name"] = "Please enter the licence or authorisation name.";
    }
    if (!str(values["finance-licence-number"])) {
      fields["finance-licence-number"] = "Please enter the licence reference/number.";
    }
    if (!str(values["finance-licence-authority"])) {
      fields["finance-licence-authority"] = "Please enter the issuing authority.";
    }
    if (!str(values["finance-licence-jurisdiction"])) {
      fields["finance-licence-jurisdiction"] = "Please enter the licence jurisdiction.";
    }
  }
  return result(fields);
}

function validateFacilities(values: QuestionnaireValues, fields: Record<string, string>) {
  const count = Math.max(1, Number(values["finance-facility-count"] ?? 1) || 1);
  let any = false;
  for (let i = 0; i < count; i += 1) {
    const lender = str(values[facilityKey(i, "lender")]);
    const type = str(values[facilityKey(i, "type")]);
    const amountRaw = values[facilityKey(i, "amount")];
    const amountStr = str(amountRaw);
    const currency = str(values[facilityKey(i, "currency")]);
    const maturityUnknown = bool(values[facilityKey(i, "maturity-unknown")]);
    const maturity = str(values[facilityKey(i, "maturity")]);
    if (!lender && !type && !amountStr && !currency && !maturity) continue;
    any = true;
    if (!lender) fields[facilityKey(i, "lender")] = `Facility ${i + 1}: enter the lender name.`;
    if (!type) fields[facilityKey(i, "type")] = `Facility ${i + 1}: enter the financing type.`;
    if (amountStr === "") {
      fields[facilityKey(i, "amount")] = `Facility ${i + 1}: enter the outstanding amount (0 is allowed).`;
    } else {
      const n = Number(amountRaw);
      if (!Number.isFinite(n) || n < 0) {
        fields[facilityKey(i, "amount")] = `Facility ${i + 1}: enter a valid outstanding amount.`;
      }
    }
    if (!currency || !(FINANCE_CURRENCIES as readonly string[]).includes(currency)) {
      fields[facilityKey(i, "currency")] = `Facility ${i + 1}: select EUR, GBP or USD.`;
    }
    if (!maturityUnknown && !maturity) {
      fields[facilityKey(i, "maturity")] = `Facility ${i + 1}: enter maturity or mark unknown.`;
    }
  }
  if (!any) {
    fields["finance-facilities"] = "Add at least one existing facility, or select No for existing financing.";
  }
}

export function validateFinancingFields(
  step: number,
  values: QuestionnaireValues,
  _pickers: CountryPickers
): FinanceValidationResult | null {
  if (step === 1) return validateFinancingEntityStep(values);
  if (step === 2) return validateFinancingBusinessStep(values);

  const fields: Record<string, string> = {};

  if (step === 12) {
    const purposeRaw = str(values["finance-purpose"]);
    const purposeKey = financePurposeKey(purposeRaw);
    if (!purposeKey) fields["finance-purpose"] = "Please select one primary financing purpose.";
    if (purposeKey === "other" && !isMeaningfulNarrative(str(values["finance-other-text"]))) {
      fields["finance-other-text"] = "Please explain the other financing purpose.";
    }
    const amount = Number(values["finance-amount"]);
    if (!Number.isFinite(amount) || amount <= 0) {
      fields["finance-amount"] = "Please enter a positive amount sought.";
    }
    const currency = str(values["finance-currency"]);
    if (!(FINANCE_CURRENCIES as readonly string[]).includes(currency)) {
      fields["finance-currency"] = "Please select EUR, GBP or USD.";
    }
    if (!isMeaningfulNarrative(str(values["finance-use"]))) {
      fields["finance-use"] = "Please briefly explain how the funds will be used.";
    }
    const timeline = str(values["finance-timeline"]);
    if (!timeline) fields["finance-timeline"] = "Please indicate when you need the financing.";
    if (timeline === "specific_date" || timeline === "On a specific date") {
      if (!str(values["finance-date"])) fields["finance-date"] = "Please enter the specific date.";
    }
    const termUnknown = bool(values["finance-term-unknown"]);
    if (!termUnknown) {
      const term = Number(values["finance-term"]);
      if (!Number.isFinite(term) || term <= 0) {
        fields["finance-term"] = "Enter a positive repayment term in years, or select that you are not yet sure.";
      }
    }
  }

  if (step === 13) {
    const purposeKey = financePurposeKey(str(values["finance-purpose"]));
    if (!str(values["finance-stage"])) {
      fields["finance-stage"] = "Please select the business or project stage.";
    }
    if (purposeKey === "maritime_vessel_finance" && !str(values["finance-project-country"])) {
      fields["finance-project-country"] = "Please indicate the project / asset location.";
    }

    const revenueStatus = str(values["finance-revenue-status"]);
    if (!(FINANCE_REVENUE_STATUS as readonly string[]).includes(revenueStatus)) {
      fields["finance-revenue-status"] = "Please select revenue status.";
    }
    const reportCurrency = str(values["finance-report-currency"]);
    if (
      !(FINANCE_CURRENCIES as readonly string[]).includes(reportCurrency) &&
      reportCurrency !== "Needs clarification"
    ) {
      fields["finance-report-currency"] = "Please select the financial reporting currency.";
    }

    const revenueRaw = str(values["finance-revenue"]);
    if (revenueRaw !== "") {
      const rev = Number(values["finance-revenue"]);
      if (!Number.isFinite(rev) || rev < 0) {
        fields["finance-revenue"] = "Enter a valid revenue amount, or leave blank.";
      }
      if (!str(values["finance-revenue-year"])) {
        fields["finance-revenue-year"] = "Select the financial year for this revenue.";
      }
    }

    const profitRaw = str(values["finance-profit"]);
    if (profitRaw !== "") {
      const profit = Number(values["finance-profit"]);
      if (!Number.isFinite(profit)) {
        fields["finance-profit"] = "Enter a valid profit or loss figure, or leave blank.";
      }
      if (!str(values["finance-revenue-year"]) && !str(values["finance-profit-year"])) {
        fields["finance-profit-year"] = "Select the financial year for this profit or loss.";
      }
    }

    const audited = str(values["finance-audited"]);
    if (!audited) {
      fields["finance-audited"] = "Please indicate whether audited statements could be provided if requested.";
    } else if (audited === "Yes") {
      const years = completedFinancialYears();
      const any = years.some((y) => bool(values[auditYearKey(y)]));
      if (!any) fields["finance-audit-years"] = "Select at least one available audited financial year.";
    }
  }

  if (step === 14) {
    const existing = str(values["finance-existing"]);
    if (existing !== "Yes" && existing !== "No") {
      fields["finance-existing"] = "Please indicate whether the company has existing financing.";
    }
    if (existing === "Yes") validateFacilities(values, fields);

    const purposeKey = financePurposeKey(str(values["finance-purpose"]));
    if (purposeKey === "refinancing" && existing === "No") {
      fields["finance-existing"] =
        "Refinancing is selected but no existing financing is declared. Please reconcile these answers.";
    }

    const security = str(values["finance-security"]);
    if (security !== "Yes" && security !== "No") {
      fields["finance-security"] = "Please indicate whether guarantees or assets are available.";
    }
    if (security === "Yes") {
      if (!isMeaningfulNarrative(str(values["finance-security-details"]))) {
        fields["finance-security-details"] = "Describe the assets or guarantees and who owns or provides them.";
      }
      const value = Number(values["finance-security-value"]);
      if (!Number.isFinite(value) || value < 0) {
        fields["finance-security-value"] = "Enter an estimated value (0 is allowed).";
      }
      const secCurr = str(values["finance-security-currency"]);
      if (
        !(FINANCE_CURRENCIES as readonly string[]).includes(secCurr) &&
        secCurr !== "Needs clarification"
      ) {
        fields["finance-security-currency"] = "Select the valuation currency.";
      }
      const pledged = str(values["finance-pledged"]);
      if (!(FINANCE_PLEDGE_STATUS as readonly string[]).includes(pledged)) {
        fields["finance-pledged"] = "Please indicate whether these assets are already pledged.";
      }
    }
  }

  if (step === 39) {
    const banking = str(values["finance-existing-banking"] || values["existing-banking"]);
    if (!banking) {
      fields["finance-existing-banking"] = "Please indicate whether the company has an existing banking relationship.";
    } else if (banking === "Yes" || banking === "Previously held now closed") {
      if (!str(values["bank-name"])) fields["bank-name"] = "Please enter the bank name.";
      if (!str(values["bank-country"])) fields["bank-country"] = "Please select the bank country.";
    }
  }

  if (step === 4) {
    const group = str(values.group);
    if (group !== "Yes" && group !== "No") {
      fields.group = "Please indicate whether the entity is part of a group.";
    }
    const corporate = str(values.corporate);
    if (corporate !== "Yes" && corporate !== "No") {
      fields.corporate = "Please indicate whether direct shareholders, partners or members are legal entities.";
    }
  }

  if (step === 5) {
    if (!str(values["contact-name"])) fields["contact-name"] = "Please enter the contact name.";
    const email = str(values["contact-email"]);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) fields["contact-email"] = "Please enter a valid contact email.";
    if (!str(values["representative-role"])) {
      fields["representative-role"] = "Please select your capacity in relation to the entity.";
    }
    if (values["representative-authority"] !== true) {
      fields["representative-authority"] = "Please confirm your authority to submit for the entity.";
    }
    if (str(values["relationship-manager-language"]) === "Other" && !str(values["relationship-manager-language-other"])) {
      fields["relationship-manager-language-other"] = "Please specify the other language.";
    }
  }

  return result(fields);
}

export function validateFinancingStep(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): string | null {
  return validateFinancingFields(step, values, pickers)?.message ?? null;
}

/** Active facilities only when existing financing is Yes. */
export function activeFinanceFacilities(values: QuestionnaireValues): Array<Record<string, string | number | boolean>> {
  if (str(values["finance-existing"]) !== "Yes") return [];
  const count = Math.max(1, Number(values["finance-facility-count"] ?? 1) || 1);
  const out: Array<Record<string, string | number | boolean>> = [];
  for (let i = 0; i < count; i += 1) {
    const lender = str(values[facilityKey(i, "lender")]);
    if (!lender) continue;
    out.push({
      lender,
      type: str(values[facilityKey(i, "type")]),
      amount: Number(values[facilityKey(i, "amount")]),
      currency: str(values[facilityKey(i, "currency")]),
      maturity: bool(values[facilityKey(i, "maturity-unknown")])
        ? "Unknown"
        : str(values[facilityKey(i, "maturity")]),
      maturityUnknown: bool(values[facilityKey(i, "maturity-unknown")]),
    });
  }
  return out;
}

export function activeAuditedYears(values: QuestionnaireValues): number[] {
  if (str(values["finance-audited"]) !== "Yes") return [];
  return completedFinancialYears().filter((y) => bool(values[auditYearKey(y)]));
}
