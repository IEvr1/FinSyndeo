import type { DictionaryRoute, QuestionnaireValues } from "./types";
import { resolveMerchantServiceScope } from "./validate-merchant";

export function resolveDictionaryRoute(values: QuestionnaireValues): DictionaryRoute {
  const applicant = String(values.applicant ?? "company");
  if (applicant === "individual") return "individual";
  if (applicant === "institution") return "institution";
  const accountType = String(values["account-type"] ?? "bank");
  if (accountType === "merchant") {
    // Settlement bank-assist activates the same combined route as both-at-start (MB01).
    return resolveMerchantServiceScope(values) === "both" ? "both" : "merchant";
  }
  if (accountType === "both") return "both";
  if (accountType === "financing") return "financing";
  return "bank";
}

export function isPersonalFlow(values: QuestionnaireValues): boolean {
  return String(values.applicant ?? "") === "individual";
}

/** Legal entity → Business bank account (LE01) uses the custom legal-entity-bank module. */
export function isLegalEntityBankFlow(values: QuestionnaireValues): boolean {
  return String(values.applicant ?? "") === "company" && String(values["account-type"] ?? "") === "bank";
}

/** Merchant-only or combined bank+merchant (MC01 / MB01). */
export function isMerchantFlow(values: QuestionnaireValues): boolean {
  const accountType = String(values["account-type"] ?? "");
  return String(values.applicant ?? "") === "company" && (accountType === "merchant" || accountType === "both");
}

/**
 * Merchant / combined navigation (MC01, MC17, MC18, MB01–MB02):
 * - Merchant-only: no Existing banking (39); bank step omitted
 * - Combined: merchant steps, then Bank account requirements (3) after Settlement (11), then ownership
 * - Bank-only: keeps Account & flows (3) and Existing banking (39 / LE10)
 */
export function getQuestionnaireFlow(values: QuestionnaireValues): number[] {
  const personal = isPersonalFlow(values);
  if (personal) {
    return [0, 1, 20, 21, 22, 23, 40];
  }

  const applicant = String(values.applicant ?? "company");
  const accountType = String(values["account-type"] ?? "bank");

  if (applicant === "institution") {
    return [0, 1, 30, 31, 32, 33, 39, 4, 5, 40];
  }

  if (accountType === "financing") {
    return [0, 1, 2, 12, 13, 14, 39, 4, 5, 40];
  }

  if (accountType === "merchant" || accountType === "both") {
    const scope = resolveMerchantServiceScope(values);
    if (scope === "both") {
      // Bank account requirements after Settlement, before Ownership (MC17 / MB01).
      return [0, 1, 2, 7, 8, 9, 10, 11, 3, 4, 5, 40];
    }
    return [0, 1, 2, 7, 8, 9, 10, 11, 4, 5, 40];
  }

  // Bank-only legal-entity route
  return [0, 1, 2, 3, 39, 4, 5, 40];
}

export function apiRouteFromValues(values: QuestionnaireValues): string {
  return resolveDictionaryRoute(values);
}
