import { LE_BANK_STEP_EYEBROWS, LE_BANK_STEP_LABELS } from "./legal-entity-bank-config";

export const STEP_LABELS: Record<number, string> = {
  0: "Start",
  1: "Applicant type",
  2: "Business activity",
  3: "Account & flows",
  4: "Ownership and control",
  5: "Contact and onboarding",
  7: "Payment channels and integration",
  8: "Customer markets and processing volumes",
  9: "Processing history",
  10: "Pricing and additional requirements",
  11: "Settlement",
  12: "Financing need",
  13: "Business and project",
  14: "Financing and security",
  20: "Personal details",
  21: "Your private banking needs",
  22: "Your background & funding",
  23: "Expected account activity",
  24: "Contact",
  30: "Institution profile",
  31: "Underlying clients",
  32: "Services & flows",
  33: "Compliance",
  39: "Existing banking",
  40: "Your assessment summary",
};

const MERCHANT_STEP_TITLES: Record<number, string> = {
  1: "Entity details",
  2: "Business activity",
  3: "Bank account requirements",
  4: "Ownership and control",
  5: "Contact and onboarding",
  7: "Payment channels and integration",
  8: "Customer markets and processing volumes",
  9: "Processing history",
  10: "Pricing and additional requirements",
  11: "Settlement",
  40: "Your assessment summary",
};

const ENTITY_STEP_TITLE = "Entity details";
const CO_STEP_TITLES: Record<number, string> = {
  1: "Company and institution identity",
  30: "Institution profile",
  31: "Underlying clients and access",
  32: "Services and flows",
  33: "Compliance",
  39: "Existing correspondent and payment relationships",
  4: "Ownership and control",
  5: "Contact and onboarding",
  40: "Your assessment summary",
};

export function stepTitleForRoute(
  step: number,
  personal: boolean,
  applicantKind: string,
  accountType = ""
): string {
  // LE01: Legal entity → Business bank account journey naming.
  if (applicantKind === "company" && accountType === "bank" && LE_BANK_STEP_LABELS[step]) {
    return LE_BANK_STEP_LABELS[step];
  }
  // MC01 / MB01: merchant and combined journey naming.
  if (
    applicantKind === "company" &&
    (accountType === "merchant" || accountType === "both") &&
    MERCHANT_STEP_TITLES[step]
  ) {
    return MERCHANT_STEP_TITLES[step];
  }
  if (applicantKind === "institution" && CO_STEP_TITLES[step]) {
    return CO_STEP_TITLES[step];
  }
  if (step === 1 && !personal && applicantKind === "company") {
    return ENTITY_STEP_TITLE;
  }
  if (step === 1 && personal) {
    return "Applicant type";
  }
  if (step === 20 && personal) {
    return "Personal details";
  }
  return stepTitle(step);
}

export const STEP_EYEBROWS: Record<number, string> = {
  0: "START",
  1: "STEP 1 · APPLICANT TYPE",
  20: "PRIVATE BANKING",
  24: "PRIVATE BANKING",
  30: "FINANCIAL INSTITUTION",
  40: "REVIEW",
};

export function stepTitle(step: number): string {
  return STEP_LABELS[step] ?? `Step ${step}`;
}

export function stepEyebrow(step: number, personal: boolean, leBank = false): string {
  if (leBank && LE_BANK_STEP_EYEBROWS[step]) return LE_BANK_STEP_EYEBROWS[step];
  if (step === 1 && personal) return "PRIVATE BANKING";
  return STEP_EYEBROWS[step] ?? `STEP · ${STEP_LABELS[step] ?? step}`;
}
