import { financePurposeKey } from "./financing-config";
import type { ApplicantField, QuestionnaireValues } from "./types";
import { isMerchantRoute } from "./validate-merchant";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "on";
}

function isFinancingRoute(values: QuestionnaireValues): boolean {
  return str(values.applicant) === "company" && str(values["account-type"]) === "financing";
}

/** Cross-service preferences removed from Financing (FN12). */
function isFinancingCrossServiceField(field: ApplicantField): boolean {
  const label = field.label ?? "";
  return (
    label.includes("same institution to serve other group companies") ||
    label.includes("same institution to offer a personal account to a UBO")
  );
}

function isFinancingHiddenSharedField(field: ApplicantField): boolean {
  const id = field.id;
  const label = field.label ?? "";
  if (id === "agent" || id?.startsWith("agent-") || labelIsEuAgentFollowUp(field.label)) return true;
  if (label.includes("corporate-services provider") && label.toLowerCase().includes("introduction")) return true;
  if (id === "plc-listed" || id === "plc-exchange" || id === "plc-disclosure") return true;
  if (label.includes("no-licence") || label.includes("does not require a licence")) return true;
  if (label === "Licence number" || label.includes("permission holder")) return true;
  if (id === "licensor-0" || id === "licence-applicability-reason") return true;
  if (isFinancingCrossServiceField(field)) return true;
  // Legacy financing dictionary fields replaced by custom steps
  if (
    id &&
    [
      "finance-other-text",
      "finance-currency-code",
      "finance-date",
      "finance-borrowing",
      "finance-refinance",
      "finance-security-details",
      "finance-security-value",
      "finance-pledged",
      "finance-period-start",
      "finance-period-end",
      "finance-audit-start",
      "finance-audit-end",
      "finance-audit-latest",
      "finance-audit-newer-period",
      "finance-audit-year",
      "finance-report-code",
      "finance-results",
    ].includes(id)
  ) {
    return true;
  }
  return false;
}

function labelIsEuAgentFollowUp(label: string | undefined): boolean {
  if (!label) return false;
  return (
    label === "EU subsidiary legal name" ||
    label === "Country of incorporation" ||
    label === "Subsidiary registration number" ||
    label === "Describe its role in receiving or processing payments"
  );
}

export function isFieldVisible(field: ApplicantField, values: QuestionnaireValues): boolean {
  const id = field.id;
  const applicant = String(values.applicant ?? "");
  const financing = isFinancingRoute(values);

  if (id === "applicant" || id === "account-type") {
    return false;
  }

  // MC01: remove EU payment-agent and corporate-services intro from Entity details on merchant.
  if (isMerchantRoute(values) && (id === "agent" || id === "agent-subsidiary" || id === "referral" || id?.startsWith("agent-"))) {
    return false;
  }
  if (isMerchantRoute(values) && labelIsEuAgentFollowUp(field.label)) {
    return false;
  }

  // Merchant custom steps replace dictionary fields for these pages.
  if (isMerchantRoute(values)) {
    const stepNum = Number(field.step);
    if ([2, 3, 4, 7, 8, 9, 10, 11].includes(stepNum)) {
      // Keep entity identity fields on step 1 only; business+merchant pages use MerchantSteps.
      if (stepNum !== 1) return false;
    }
  }

  if (applicant === "individual") {
    const entityOnly = new Set([
      "company-name",
      "incorporation",
      "registration",
      "registration-notissued",
      "registration-exception-reason",
      "agent",
      "agent-subsidiary",
      "entity-type",
      "entity-type-other",
      "account-type",
    ]);
    if ((id && entityOnly.has(id)) || labelIsEuAgentFollowUp(field.label)) {
      return false;
    }
  }

  if (applicant === "institution") {
    if (id === "account-type" || id === "entity-type" || id === "entity-type-other" || id === "agent" || id === "referral") {
      return false;
    }
    if (labelIsEuAgentFollowUp(field.label)) {
      return false;
    }
    // CO02: Canada MSB branch only when MSB + Canada incorporation.
    const category = str(values["co-institution-category"]);
    const incorporation = str(values.incorporation);
    const isMsbCanada = category === "msb" && /canada/i.test(incorporation);
    const isCasp = category === "casp";
    if (id?.startsWith("msb-") && !isMsbCanada) return false;
    if (id?.startsWith("casp-") && !isCasp) return false;
    // CO08: DDQ and compliance contact removed from active UI.
    if (id === "fi-ddq" || id === "fi-compliance-name" || id === "fi-compliance-email") return false;
    // CO04: client-funds schedules only when explicitly selected.
    if (
      !bool(values["co-client-funds"]) &&
      id &&
      (id.startsWith("fi-client-") || id === "fi-client-in" || id === "fi-client-out")
    ) {
      return false;
    }
    // CO11: group name only when Yes.
    if ((id === "group-name" || field.label === "Group name") && str(values.group) !== "Yes") {
      return false;
    }
  }

  if (financing && isFinancingHiddenSharedField(field)) {
    return false;
  }

  // Financing steps 12–14 use custom components; hide dictionary duplicates.
  if (financing && field.step && ["12", "13", "14"].includes(field.step)) {
    return false;
  }
  // Website URL collected via financing website-status control.
  if (financing && id === "website") {
    return false;
  }

  if (id === "registration-exception-reason" || id === "registration-notissued") {
    return bool(values["registration-notissued"]);
  }
  if (id === "registration" && bool(values["registration-notissued"])) {
    return false;
  }
  if (id === "entity-type-other") {
    if (financing) return false;
    return str(values["entity-type"]).includes("Other");
  }
  if (id === "plc-exchange" || id === "plc-disclosure") {
    return str(values["plc-listed"]) === "Yes";
  }
  if (id === "agent-subsidiary" || id?.startsWith("agent-")) {
    return str(values.agent) === "Yes";
  }
  if (
    labelIsEuAgentFollowUp(field.label) &&
    str(values.agent) !== "Yes"
  ) {
    return false;
  }
  if (id === "representative-firm") {
    const role = str(values["representative-role"]);
    return role.includes("Adviser") || role.includes("Agent") || role.includes("Other") || role.includes("External");
  }
  if (id === "purpose-other-check" || field.key === "id:purpose-other-check") {
    return true;
  }
  if (id === "finance-other-text") {
    return financePurposeKey(str(values["finance-purpose"])) === "other";
  }
  if (id === "finance-currency-code") {
    return false;
  }
  if (id === "estimate-other-code") {
    return str(values["estimate-currency"]) === "Other";
  }
  // G02: CHF / other currencies are no longer offered on bank pickers; keep them visible only when a
  // historical draft already selected them so existing answers are not silently dropped.
  if (field.step === "3" && field.label === "Swiss franc (CHF)" && values[id ?? field.key] !== true) {
    return false;
  }
  if (id === "bank-other-currency" && values[id] !== true) {
    return false;
  }
  if (id === "bank-other-text") {
    return bool(values["bank-other-currency"]);
  }
  if (id === "pb-currencies-text") {
    return bool(values["pb-currencies-other"]);
  }
  if (id === "fi-other-currency-text") {
    return bool(values["fi-other-currency"]);
  }

  // Group name: optional and only when Yes (FN12).
  if (financing && (id === "group-name" || field.label === "Group name")) {
    return str(values.group) === "Yes";
  }

  // FN11: no personal UBO names at initial financing stage; hide trust/association roles.
  if (financing && field.step === "4") {
    const label = field.label ?? "";
    if (label === "Full name of this person") return false;
    if (
      label === "Trustee / council member" ||
      label === "Beneficiary" ||
      label === "Founder"
    ) {
      return false;
    }
    if (label === "Shareholder entity name" || (label === "Jurisdiction of incorporation" && !id)) {
      return str(values.corporate) === "Yes";
    }
    // Partnership / LLP: prefer partner/member wording; keep ownership % only when relevant.
    const entity = str(values["entity-type"]);
    const isPartnership =
      entity === "Partnership" || entity === "Limited liability partnership (LLP)";
    if (isPartnership && label === "Beneficial owner") return false;
    if (!isPartnership && label === "Partner / member") return false;
  }

  // Existing banking records only when a relationship is declared (FN10).
  if (financing && field.step === "39") {
    const banking = str(values["finance-existing-banking"] || values["existing-banking"]);
    const label = field.label ?? "";
    if (label === "Yes" || label === "No" || label === "Prefer not to answer") return true;
    if (!banking || banking === "No") return false;
  }

  // Security / facility inactive branches (also enforced in custom steps).
  if (id === "finance-borrowing" || id === "finance-refinance") {
    return str(values["finance-existing"]) === "Yes";
  }
  if (id === "finance-security-details" || id === "finance-security-value" || id === "finance-pledged") {
    return str(values["finance-security"]) === "Yes";
  }

  return true;
}

export function isRenderableVisible(
  item: { kind: string; field?: ApplicantField; name?: string },
  values: QuestionnaireValues
): boolean {
  if (item.kind === "field" && item.field) {
    return isFieldVisible(item.field, values);
  }
  if (item.kind === "radio-group" && item.name === "licence") {
    return str(values.industry) !== "" || str(values.activity) !== "";
  }
  return true;
}
