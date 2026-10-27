import {
  CO_CURRENCIES,
  CO_INSTITUTION_CATEGORIES,
  CO_SERVICES,
  CO_UBO_COVERAGE_TARGET,
  activityDeclared,
  coClientTypeKey,
  coCurrKey,
  coCurrLevelKey,
  coSvcKey,
  flowCountriesKey,
  flowKey,
  isInactiveActivity,
  parseJsonList,
  type CoCorporateShareholder,
  type CoExistingProvider,
  type CoUbo,
  websiteUnavailableKey,
} from "./correspondent-config";
import type { CountryPickers, QuestionnaireValues } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true;
}

function isFiller(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length === 1) return true;
  if (/^(.)\1{2,}$/i.test(t)) return true;
  if (/^(test|asdf|xxx|n\/a|na|none)\s*$/i.test(t)) return true;
  return false;
}

function meaningful(text: string): boolean {
  return !isFiller(text);
}

export type CoValidationResult = {
  message: string;
  fields: Record<string, string>;
  firstField?: string;
};

function fail(fields: Record<string, string>): CoValidationResult | null {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  return {
    message: fields[keys[0]] ?? "Please complete the required fields.",
    fields,
    firstField: keys[0],
  };
}

export function validateCorrespondentStep(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): string | null {
  return validateCorrespondentFields(step, values, pickers)?.message ?? null;
}

export function validateCorrespondentFields(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): CoValidationResult | null {
  const fields: Record<string, string> = {};
  const category = str(values["co-institution-category"]);
  const incorporation = str(values.incorporation);
  const isMsbCanada = category === "msb" && /canada/i.test(incorporation);
  const isCasp = category === "casp";
  const clientFunds = bool(values["co-client-funds"]);
  const safeguarding = bool(values[coSvcKey("client_funds_safeguarding")]);

  if (step === 1) {
    if (!str(values.applicant)) fields.applicant = "Please select who this assessment is for.";
    if (!category || !CO_INSTITUTION_CATEGORIES.some((c) => c.id === category)) {
      fields["co-institution-category"] = "Please select an institution category.";
    }
    if (!str(values["company-name"])) fields["company-name"] = "Please enter the registered legal name.";
    if (!incorporation) fields.incorporation = "Please select the country of incorporation.";
    if (!str(values.registration) && !bool(values["registration-notissued"])) {
      fields.registration = "Please enter the registration number or mark the identifier exception.";
    }
    if (bool(values["registration-notissued"]) && !meaningful(str(values["registration-exception-reason"]))) {
      fields["registration-exception-reason"] = "Please explain why no official identifier is issued.";
    }
    const website = str(values["fi-website"] ?? values.website);
    const unavailable = bool(values[websiteUnavailableKey()]);
    if (!website && !unavailable) {
      fields["fi-website"] = "Enter the institution website, or mark that it is unavailable / under development.";
    }
    if (unavailable && !meaningful(str(values["co-website-reason"]))) {
      fields["co-website-reason"] = "Please explain why the website is unavailable or under development.";
    }
    if (website && !unavailable && !/^https?:\/\/.+/i.test(website) && !/^[a-z0-9.-]+\.[a-z]{2,}/i.test(website)) {
      fields["fi-website"] = "Please enter a valid website URL.";
    }
    // Legacy unsupported entity types must be corrected, never silently converted.
    const entity = str(values["entity-type"]);
    if (
      entity &&
      !/private limited/i.test(entity) &&
      entity !== "Private limited company (Ltd / LLC or equivalent)"
    ) {
      fields["entity-type"] =
        "This route supports incorporated private companies only. Please correct the legal entity type rather than continuing with an unsupported type.";
    }
  }

  if (step === 30) {
    if (!category) fields["co-institution-category"] = "Institution category is required.";
    if (!str(values["fi-status"])) fields["fi-status"] = "Please select regulatory status.";
    if (!meaningful(str(values["fi-regulatory"]))) {
      fields["fi-regulatory"] = "Please name the regulator or issuing authority.";
    }
    if (!str(values["fi-reference"])) {
      fields["fi-reference"] = "Please enter the licence or registration reference.";
    }
    if (category === "msb" && !isMsbCanada) {
      // Non-Canadian MSB: no Canada branch required; do not require msb-country as Bank blocker.
    }
    if (isMsbCanada) {
      if (!str(values["msb-office"])) fields["msb-office"] = "Please answer the Canadian office question.";
      if (!str(values["msb-director"])) fields["msb-director"] = "Please answer the Canadian director question.";
      if (!str(values["msb-boc"])) fields["msb-boc"] = "Please select Bank of Canada PSP registration status.";
    }
    if (isCasp) {
      if (!str(values["casp-mica"])) fields["casp-mica"] = "Please select MiCA status.";
      if (!meaningful(str(values["casp-assets"]))) {
        fields["casp-assets"] = "Please describe crypto-assets and networks supported.";
      }
      if (!str(values["casp-wallets"])) fields["casp-wallets"] = "Please answer the self-hosted wallet question.";
      if (!str(values["casp-travel"])) fields["casp-travel"] = "Please select Travel Rule arrangements.";
      if (!str(values["casp-chain"])) fields["casp-chain"] = "Please select blockchain screening status.";
    }
  }

  if (step === 31) {
    const anyClient = ["individuals", "businesses", "other_fis"].some((id) => bool(values[coClientTypeKey(id)]));
    if (!anyClient) fields["co-clients"] = "Select at least one underlying client type.";
    if (!meaningful(str(values["fi-client-profile"]))) {
      fields["fi-client-profile"] = "Please describe main client industries and business activities.";
    }
    if (!(pickers["fi-underlying-countries"]?.length ?? 0)) {
      fields["fi-underlying-countries"] =
        "Select specific underlying client countries. Regions alone are not enough.";
    }
    const nested = str(values["fi-downstream"]);
    if (!nested) fields["fi-downstream"] = "Please answer the nested institution processing question.";
    if (nested === "Yes" && !meaningful(str(values["fi-downstream-text"]))) {
      fields["fi-downstream-text"] =
        "Describe those institutions, their countries and the customers they serve.";
    }
    const access = str(values["fi-access"]);
    if (!access) fields["fi-access"] = "Please answer whether underlying clients can directly access the account.";
    if (access === "Yes" && !meaningful(str(values["fi-access-text"]))) {
      fields["fi-access-text"] = "Explain how clients would access or use the account and the controls in place.";
    }
  }

  if (step === 32) {
    if (safeguarding && !clientFunds) {
      fields["co-client-funds"] =
        "Safeguarding of client funds requires an explicit dedicated client-funds account selection.";
    }
    if (bool(values[coSvcKey("other")]) && !meaningful(str(values["co-svc-other-text"]))) {
      fields["co-svc-other-text"] = "Please describe the other service.";
    }
    const anyCurr = CO_CURRENCIES.some((c) => bool(values[coCurrKey(c)]));
    if (!anyCurr) fields["co-currencies"] = "Select at least one currency (EUR, GBP or USD).";
    for (const code of CO_CURRENCIES) {
      if (!bool(values[coCurrKey(code)])) continue;
      const level = str(values[coCurrLevelKey(code)]);
      if (level !== "required" && level !== "preferred") {
        fields[coCurrLevelKey(code)] = `Choose Must-have or Good to have for ${code}.`;
      }
      validateFlowScope("operating", code, values, pickers, fields);
      if (clientFunds) validateFlowScope("client", code, values, pickers, fields);
    }
    if (!meaningful(str(values["fi-fund-model"]))) {
      fields["fi-fund-model"] =
        "Explain whose money will be held or transferred and how the account will be used.";
    }
  }

  if (step === 33) {
    const amlro = str(values["fi-mlro"]);
    if (amlro !== "Internal" && amlro !== "External") {
      fields["fi-mlro"] = "Please select Internal or External AMLRO.";
    }
    if (!str(values["fi-mlro-country"])) {
      fields["fi-mlro-country"] = "Please select the country where the AMLRO is based.";
    }
    if (!str(values["fi-aml"])) {
      fields["fi-aml"] = "Please answer the documented AML/KYC controls question.";
    }
    const audit = str(values["fi-audit"]);
    if (!audit) fields["fi-audit"] = "Please answer whether a recent independent AML review is available.";
    if (audit === "Yes" && !str(values["fi-audit-year"])) {
      fields["fi-audit-year"] = "Please select the year of the independent AML review.";
    }
  }

  if (step === 39) {
    if (!meaningful(str(values["fi-reason"]))) {
      fields["fi-reason"] = "Please explain why you are seeking this relationship.";
    }
    const rows = parseJsonList<CoExistingProvider>(values["co-existing-providers"]);
    rows.forEach((row, i) => {
      const partial = Boolean(str(row.name) || str(row.country) || str(row.status));
      const complete = Boolean(str(row.name) && str(row.country) && str(row.status));
      if (partial && !complete) {
        fields[`co-existing-${row.id || i}`] =
          "Complete name, country and status for each existing provider row, or remove the row.";
      }
    });
  }

  if (step === 4) {
    const corp = str(values.corporate);
    if (corp !== "Yes" && corp !== "No") {
      fields.corporate = "Please answer whether any shareholders are legal entities.";
    }
    if (corp === "Yes") {
      const corps = parseJsonList<CoCorporateShareholder>(values["co-corporate-shareholders"]);
      if (!corps.length) {
        fields["co-corporate-shareholders"] = "Add at least one corporate shareholder, or answer No.";
      }
      let corpTotal = 0;
      for (const row of corps) {
        if (!str(row.jurisdiction)) {
          fields[`co-corp-${row.id}-jurisdiction`] = "Enter incorporation jurisdiction for each corporate shareholder.";
        }
        const pct = Number(row.shareholding);
        if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
          fields[`co-corp-${row.id}-pct`] = "Shareholding in the applicant company (%) must be a number up to 100.";
        } else {
          corpTotal += pct;
        }
      }
      if (corpTotal > 100) {
        fields["co-corporate-shareholders"] = "Corporate shareholding percentages cannot exceed 100% in total.";
      }
    }

    const ubos = parseJsonList<CoUbo>(values["co-ubos"]);
    if (!ubos.length) {
      fields["co-ubos"] = "Add at least one natural-person ultimate beneficial owner.";
    }
    let uboTotal = 0;
    for (const ubo of ubos) {
      const pct = Number(ubo.ownership);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        fields[`co-ubo-${ubo.id}-pct`] =
          "Beneficial ownership of the applicant company (%) must be a number up to 100.";
      } else {
        uboTotal += pct;
      }
      if (!(ubo.nationalities?.length ?? 0)) {
        fields[`co-ubo-${ubo.id}-nat`] = "Select nationality or nationalities for each UBO.";
      }
      if (!str(ubo.residence)) {
        fields[`co-ubo-${ubo.id}-res`] = "Select country of residence for each UBO.";
      }
    }
    if (uboTotal > 100) {
      fields["co-ubos"] = "Beneficial ownership percentages cannot exceed 100% in total.";
    }
    if (uboTotal < CO_UBO_COVERAGE_TARGET && !meaningful(str(values["ownership-clarification"]))) {
      fields["ownership-clarification"] =
        `UBO coverage is below the ${CO_UBO_COVERAGE_TARGET}% initial assessment target. Provide a meaningful explanation, or add further UBOs.`;
    }

    const group = str(values.group);
    if (group !== "Yes" && group !== "No") {
      fields.group = "Please answer whether the company is part of a group.";
    }
  }

  return fail(fields);
}

function validateFlowScope(
  scope: "operating" | "client",
  currency: string,
  values: QuestionnaireValues,
  pickers: CountryPickers,
  fields: Record<string, string>
) {
  for (const dir of ["in", "out"] as const) {
    const amount = str(values[flowKey(scope, currency, dir, "amount")]);
    const count = str(values[flowKey(scope, currency, dir, "count")]);
    const label = `${scope === "operating" ? "Operating" : "Client funds"} ${currency} ${dir === "in" ? "incoming" : "outgoing"}`;
    if (!amount) fields[flowKey(scope, currency, dir, "amount")] = `${label}: select an amount band.`;
    if (!count) fields[flowKey(scope, currency, dir, "count")] = `${label}: select a transaction count band.`;
    if (isInactiveActivity(amount) || isInactiveActivity(count)) continue;
    if (activityDeclared(amount) || activityDeclared(count)) {
      const countries = pickers[flowCountriesKey(scope, currency, dir)] ?? [];
      if (!countries.length) {
        fields[flowCountriesKey(scope, currency, dir)] = `${label}: select main countries.`;
      }
      if (!meaningful(str(values[flowKey(scope, currency, dir, "purpose")]))) {
        fields[flowKey(scope, currency, dir, "purpose")] = `${label}: enter a meaningful purpose.`;
      }
    }
  }
}

/** Active-branch helpers for summary / typed data (inactive branches excluded). */
export function activeCorrespondentBranch(values: QuestionnaireValues) {
  const category = str(values["co-institution-category"]);
  const incorporation = str(values.incorporation);
  return {
    category,
    isMsbCanada: category === "msb" && /canada/i.test(incorporation),
    isCasp: category === "casp",
    clientFunds: bool(values["co-client-funds"]),
    corporateYes: str(values.corporate) === "Yes",
    groupYes: str(values.group) === "Yes",
    selectedServices: CO_SERVICES.filter((s) => bool(values[coSvcKey(s.id)])),
    selectedCurrencies: CO_CURRENCIES.filter((c) => bool(values[coCurrKey(c)])),
  };
}
