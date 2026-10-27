/**
 * Field-level validation for the Legal Entity → Business bank account journey (LE19).
 * Only active branches are validated — hidden/inactive fields never raise errors.
 */

import {
  LE_ACTIVITY_MIN_LENGTH,
  LE_BANK_STEPS,
  LE_MIN_COVERAGE,
  capacityNeedsFirm,
  capacityOptions,
  euAgentApplicable,
  flowPurposes,
  isMeaningfulText,
  isPublicCompany,
  isTrust,
  leAmountKey,
  leCorpJurKey,
  leCorpPctKey,
  leCountKey,
  leCountriesId,
  leCountriesUnknownKey,
  leFlowPurposeKey,
  leFlowPurposeOtherKey,
  licenceActive,
  licenceImmediate,
  lePersonCountKey,
  lePersonKey,
  lePersonNatId,
  lePurposeKey,
  ownershipGroup,
  rowCount,
  selectedAccounts,
  selectedCurrencies,
  structureByLabel,
  type LeDirection,
} from "./legal-entity-bank-config";
import type { CountryPickers, QuestionnaireValues } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true;
}

function pct(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type LeValidationResult = {
  message: string;
  fields: Record<string, string>;
  firstField?: string;
};

function finish(fields: Record<string, string>): LeValidationResult | null {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const firstField = keys[0];
  const message =
    keys.length === 1
      ? fields[firstField]
      : `Please complete ${keys.length} required items below. First: ${fields[firstField]}`;
  return { message, fields, firstField };
}

const WEBSITE_RE = /^(https?:\/\/)?[^\s/$.?#][^\s]*\.[^\s]{2,}$/i;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validateEntity(values: QuestionnaireValues, fields: Record<string, string>) {
  const trust = isTrust(values);
  if (!str(values["entity-type"]) || !structureByLabel(values["entity-type"])) {
    fields["entity-type"] = "Please select the legal structure.";
  } else if (str(values["entity-type"]) === "Other" && !isMeaningfulText(values["entity-type-other"])) {
    fields["entity-type-other"] = "Please specify the legal structure.";
  }
  if (!isMeaningfulText(values["company-name"], 2)) {
    fields["company-name"] = trust ? "Please enter the trust name." : "Please enter the registered entity name.";
  }
  if (!str(values.incorporation)) {
    fields.incorporation = trust
      ? "Please select the country where the trust is established."
      : "Please select the country / jurisdiction of incorporation.";
  }
  if (trust && !str(values["trust-governing-law"])) {
    fields["trust-governing-law"] = "Please select the governing-law jurisdiction.";
  }
  const notIssued = bool(values["registration-notissued"]);
  if (!notIssued && !str(values.registration)) {
    fields.registration = trust
      ? "Please enter the trust registration / reference number, or mark it as not applicable."
      : "Please enter the registration number or mark the identifier exception.";
  }
  if (notIssued && !trust && !isMeaningfulText(values["registration-exception-reason"])) {
    fields["registration-exception-reason"] = "Please explain why no official identifier is issued.";
  }
}

function validateActivity(values: QuestionnaireValues, fields: Record<string, string>) {
  const status = str(values["website-status"]);
  if (!status) {
    fields["website-status"] = "Please choose a website status.";
  } else if (status === "available") {
    const url = str(values.website);
    if (!url) fields.website = "Please enter the website address.";
    else if (!WEBSITE_RE.test(url)) fields.website = "Please enter a valid website address.";
  } else if (!isMeaningfulText(values["website-reason"], 4)) {
    fields["website-reason"] = "Please give a brief reason (not a single letter or filler).";
  }

  if (!str(values.industry)) {
    fields.industry = "Please select an industry.";
  } else if (str(values.industry) === "Other" && !isMeaningfulText(values["industry-other"])) {
    fields["industry-other"] = "Please specify your industry.";
  }

  const activity = str(values.activity);
  if (!isMeaningfulText(activity, LE_ACTIVITY_MIN_LENGTH)) {
    fields.activity =
      "Please describe the business activity in a meaningful sentence or two (at least " +
      `${LE_ACTIVITY_MIN_LENGTH} characters).`;
  }

  if (str(values.industry)) {
    if (!licenceImmediate(values) && !str(values.licence)) {
      fields.licence = "Please answer whether the activity is licensed or authorised.";
    }
    if (licenceActive(values)) {
      if (!isMeaningfulText(values["licence-name"])) fields["licence-name"] = "Please enter the licence name or type.";
      if (!str(values["licence-reference"])) fields["licence-reference"] = "Please enter the licence reference.";
      if (!isMeaningfulText(values["licence-authority"])) {
        fields["licence-authority"] = "Please enter the issuing authority.";
      }
      if (!str(values["licence-jurisdiction"])) {
        fields["licence-jurisdiction"] = "Please select the licensing jurisdiction.";
      }
    }
  }

  if (euAgentApplicable(values) && !str(values.agent)) {
    fields.agent = "Please indicate whether an EU payment agent will be used.";
  }

  if (!str(values.employees)) fields.employees = "Please select the number of employees.";

  const mode = str(values.offices);
  if (!mode) {
    fields.offices = isTrust(values)
      ? "Please say where the trust is administered or operated."
      : "Please say where the entity has physical offices.";
  }
}

function validateFlowDirection(
  dir: LeDirection,
  account: string,
  values: QuestionnaireValues,
  pickers: CountryPickers,
  currencies: string[],
  fields: Record<string, string>
) {
  const word = dir === "in" ? "incoming" : "outgoing";
  const accLabel = account === "client_funds" ? "client-funds account" : "operating account";
  let active = false;
  for (const code of currencies) {
    const cKey = leCountKey(dir, account, code);
    const aKey = leAmountKey(dir, account, code);
    const count = str(values[cKey]);
    const amount = str(values[aKey]);
    if (!count) fields[cKey] = `Select expected ${word} transactions per month for ${code} (${accLabel}).`;
    if (!amount) fields[aKey] = `Select expected ${word} amount per month for ${code} (${accLabel}).`;
    if (count !== "none" || amount !== "none") active = true;
  }
  if (!active) return;

  const countriesId = leCountriesId(dir, account);
  if (!bool(values[leCountriesUnknownKey(dir, account)]) && !(pickers[countriesId]?.length ?? 0)) {
    fields[countriesId] = `Select ${word} countries for the ${accLabel}, or choose "Countries not yet known".`;
  }
  const purposes = flowPurposes(dir, account);
  const purposesId = `le-${dir}-purposes:${account}`;
  if (!purposes.some((p) => bool(values[leFlowPurposeKey(dir, account, p.id)]))) {
    fields[purposesId] = `Select at least one purpose of ${word} payments for the ${accLabel}.`;
  }
  if (bool(values[leFlowPurposeKey(dir, account, "other")]) && !isMeaningfulText(values[leFlowPurposeOtherKey(dir, account)])) {
    fields[leFlowPurposeOtherKey(dir, account)] = `Please specify the other ${word} purpose.`;
  }
}

function validateAccounts(values: QuestionnaireValues, pickers: CountryPickers, fields: Record<string, string>) {
  const accounts = selectedAccounts(values);
  if (!accounts.length) {
    fields["le-accounts"] = "Select at least one account type: operating account or dedicated client-funds account.";
  }
  if (bool(values[lePurposeKey("other")]) && !isMeaningfulText(values["le-purpose-other"])) {
    fields["le-purpose-other"] = "Please explain the other purpose.";
  }
  if (bool(values[lePurposeKey("facility")]) && !isMeaningfulText(values["le-facility-text"])) {
    fields["le-facility-text"] = "Please describe the banking facility you need.";
  }
  const currencies = selectedCurrencies(values);
  if (!currencies.length) {
    fields["le-currencies"] = "Select at least one currency (EUR, GBP or USD).";
    return;
  }
  for (const account of accounts) {
    validateFlowDirection("in", account, values, pickers, currencies, fields);
    validateFlowDirection("out", account, values, pickers, currencies, fields);
  }
}

function validateExistingBanking(values: QuestionnaireValues, fields: Record<string, string>) {
  if (!str(values["existing-banking"])) {
    fields["existing-banking"] = "Please say whether the entity has an existing, absent or closed bank account.";
  }
}

function validatePersonRows(
  prefix: string,
  values: QuestionnaireValues,
  pickers: CountryPickers,
  fields: Record<string, string>,
  opts: { percent: boolean; roleSelect: boolean }
) {
  const count = rowCount(values, lePersonCountKey(prefix));
  for (let i = 0; i < count; i += 1) {
    const role = str(values[lePersonKey(prefix, "role", i)]);
    const classOrOther = role === "Beneficiary class" || role === "Other control";
    if (opts.roleSelect && !role) fields[lePersonKey(prefix, "role", i)] = `Select a role for row ${i + 1}.`;
    if (opts.percent) {
      const v = pct(values[lePersonKey(prefix, "pct", i)]);
      if (v === null || v <= 0 || v > 100) {
        fields[lePersonKey(prefix, "pct", i)] = `Enter a percentage above 0 and up to 100 for row ${i + 1}.`;
      }
    }
    if (classOrOther) {
      if (!isMeaningfulText(values[lePersonKey(prefix, "desc", i)], 4)) {
        fields[lePersonKey(prefix, "desc", i)] = `Describe the ${role.toLowerCase()} for row ${i + 1}.`;
      }
    } else {
      if (!(pickers[lePersonNatId(prefix, i)]?.length ?? 0)) {
        fields[lePersonNatId(prefix, i)] = `Select at least one nationality for row ${i + 1}.`;
      }
      if (!str(values[lePersonKey(prefix, "res", i)])) {
        fields[lePersonKey(prefix, "res", i)] = `Select the country of residence for row ${i + 1}.`;
      }
    }
  }
  return count;
}

function validatePercentCoverage(prefix: string, values: QuestionnaireValues, fields: Record<string, string>, noun: string) {
  const count = rowCount(values, lePersonCountKey(prefix));
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const v = pct(values[lePersonKey(prefix, "pct", i)]);
    if (v !== null && v > 0) total += v;
  }
  const key = `le-${prefix}-coverage`;
  if (total > 100.0001) {
    fields[key] = `${noun} add up to ${total}% — the total cannot exceed 100%.`;
  } else if (total < LE_MIN_COVERAGE) {
    fields[key] = `${noun} must cover at least ${LE_MIN_COVERAGE}% (currently ${total}%).`;
  }
}

function validateOwnership(values: QuestionnaireValues, pickers: CountryPickers, fields: Record<string, string>) {
  const group = ownershipGroup(values);

  if (group === "company") {
    if (isPublicCompany(values)) {
      if (!str(values["plc-listed"])) fields["plc-listed"] = "Please say whether the company is listed on a stock exchange.";
      else if (values["plc-listed"] === "Yes" && !isMeaningfulText(values["plc-exchange"])) {
        fields["plc-exchange"] = "Please enter the stock exchange and ticker / listing identifier.";
      }
    }
    if (!str(values.corporate)) {
      fields.corporate = "Please say whether any shareholders are legal entities.";
    } else if (values.corporate === "Yes") {
      const n = rowCount(values, "le-corp-count");
      if (n < 1) fields["le-corp-count"] = "Add at least one corporate shareholder (jurisdiction and shareholding %).";
      let total = 0;
      for (let i = 0; i < n; i += 1) {
        if (!str(values[leCorpJurKey(i)])) fields[leCorpJurKey(i)] = `Select the jurisdiction for corporate shareholder ${i + 1}.`;
        const v = pct(values[leCorpPctKey(i)]);
        if (v === null || v <= 0 || v > 100) {
          fields[leCorpPctKey(i)] = `Enter a shareholding above 0 and up to 100% for corporate shareholder ${i + 1}.`;
        } else total += v;
      }
      if (total > 100.0001) fields["le-corp-count"] = `Corporate shareholdings add up to ${total}% — the total cannot exceed 100%.`;
    }
    const count = validatePersonRows("bo", values, pickers, fields, { percent: true, roleSelect: false });
    if (count < 1) fields["le-bo-count"] = "Add at least one beneficial owner (percentage, nationality and residence).";
    else validatePercentCoverage("bo", values, fields, "Beneficial ownership percentages");
  }

  if (group === "partnership") {
    const route = str(values["le-partner-route"]);
    if (!route) {
      fields["le-partner-route"] = "Choose how to describe the partners' interests: percentages or control.";
    } else if (route === "percentage") {
      const count = validatePersonRows("partner", values, pickers, fields, { percent: true, roleSelect: false });
      if (count < 1) fields["le-partner-count"] = "Add at least one partner (interest %, nationality and residence).";
      else validatePercentCoverage("partner", values, fields, "Partner interests");
    } else if (!isMeaningfulText(values["nonshare-structure"], LE_ACTIVITY_MIN_LENGTH)) {
      fields["nonshare-structure"] = "Please describe who controls the partnership.";
    }
  }

  if (group === "nonshare") {
    const count = validatePersonRows("role", values, pickers, fields, { percent: false, roleSelect: true });
    if (count < 1) fields["le-role-count"] = "Add at least one controlling role (founder, council member, beneficiary…).";
    if (!isMeaningfulText(values["nonshare-structure"], LE_ACTIVITY_MIN_LENGTH)) {
      fields["nonshare-structure"] = "Please describe who controls or governs this entity.";
    }
  }

  if (group === "trust") {
    const count = validatePersonRows("trust", values, pickers, fields, { percent: false, roleSelect: true });
    const roles = new Set<string>();
    for (let i = 0; i < count; i += 1) roles.add(str(values[lePersonKey("trust", "role", i)]));
    if (!roles.has("Settlor")) fields["le-trust-count"] = "Add at least one Settlor.";
    else if (!roles.has("Trustee")) fields["le-trust-count"] = "Add at least one Trustee.";
    else if (!roles.has("Beneficiary") && !roles.has("Beneficiary class")) {
      fields["le-trust-count"] = "Add at least one Beneficiary or class of beneficiaries.";
    }
    const protector = str(values["le-trust-protector"]);
    if (!protector) fields["le-trust-protector"] = "Please say whether the trust has a protector.";
    else if (protector === "Yes" && !roles.has("Protector")) {
      fields["le-trust-protector"] = "Add a Protector row, or answer No.";
    }
  }

  // Group membership is separate; group name is optional and never mandatory.
  if (!str(values.group)) fields.group = "Please say whether the entity is part of a group.";
}

function validateContact(values: QuestionnaireValues, fields: Record<string, string>) {
  if (!str(values["contact-name"])) fields["contact-name"] = "Please enter the contact name.";
  const email = str(values["contact-email"]);
  if (!email || !EMAIL_RE.test(email)) fields["contact-email"] = "Please enter a valid contact email.";
  const role = str(values["representative-role"]);
  if (!role) {
    fields["representative-role"] = "Please select the capacity in which you are applying.";
  } else if (!capacityOptions(ownershipGroup(values)).includes(role)) {
    fields["representative-role"] = "Please re-select your capacity for this legal structure.";
  } else if (capacityNeedsFirm(role) && !isMeaningfulText(values["representative-firm"], 3)) {
    fields["representative-firm"] = "Please enter the firm name and your role.";
  }
  if (values["representative-authority"] !== true) {
    fields["representative-authority"] = "Please confirm you are authorised to submit this request.";
  }
}

export function validateLegalEntityBankFields(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): LeValidationResult | null {
  const fields: Record<string, string> = {};
  if (step === 1) validateEntity(values, fields);
  if (step === 2) validateActivity(values, fields);
  if (step === 3) validateAccounts(values, pickers, fields);
  if (step === 39) validateExistingBanking(values, fields);
  if (step === 4) validateOwnership(values, pickers, fields);
  if (step === 5) validateContact(values, fields);
  return finish(fields);
}

export function validateLegalEntityBankStep(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): string | null {
  return validateLegalEntityBankFields(step, values, pickers)?.message ?? null;
}

/** Validate every journey step in order; returns the first failing step and result. */
export function validateLegalEntityBankAll(
  values: QuestionnaireValues,
  pickers: CountryPickers
): { step: number; result: LeValidationResult } | null {
  for (const step of LE_BANK_STEPS) {
    const result = validateLegalEntityBankFields(step, values, pickers);
    if (result) return { step, result };
  }
  return null;
}

/** Steps whose custom bank UI replaces the dictionary renderer. */
export function isLegalEntityBankStep(step: number): boolean {
  return (LE_BANK_STEPS as readonly number[]).includes(step);
}