import type { ProviderDraftState } from "./types";
import { FAMILIES, STEP_LABELS, STEP_ORDER } from "./config";
import { providerJurisdictionOptions } from "./countries";
import { getActiveCountryPolicy, validateCountrySelection } from "@/lib/country-policy";
import { activeOffers } from "./state";

function need(missing: string[], label: string, value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    missing.push(label);
  }
}

function offerLabel(o: { family: string; data: Record<string, unknown> }) {
  return FAMILIES[o.family] ?? o.family;
}

export type StepValidationGroup = {
  step: number;
  label: string;
  missing: string[];
};

export function validateProviderStep(state: ProviderDraftState, step: number): string[] {
  const missing: string[] = [];
  const c = state.core;
  const allowedCountries = new Set(providerJurisdictionOptions());
  const offers = activeOffers(state);

  if (step === 0) {
    need(missing, "Registered institution name", c.legalName);
    need(missing, "Incorporation country", c.country);
    if (c.country && !allowedCountries.has(String(c.country))) {
      missing.push("Incorporation country is not accepted under the current exclusion policy.");
    }
    if (c.type === "Other — please specify") {
      need(missing, "Institution type (other)", c.typeOther);
    }
    need(missing, "Registration number", c.registration);
    need(missing, "Institution type", c.type);
    need(missing, "Website", c.website);
    need(missing, "Operating year", c.founded);
    const year = Number(c.founded);
    if (c.founded && (!Number.isInteger(year) || year < 1800 || year > new Date().getFullYear())) {
      missing.push("Enter a valid operating year.");
    }
    need(missing, "Referral agreement status", c.agreement);
    if (!isAgreementVerified(state)) {
      missing.push(
        "Continue, submission and matching require a current referral agreement verified by SOPHIMA. Self-declared “Signed and current” is not verification."
      );
    }
  }

  if (step === 1) {
    state.licenses.forEach((l, i) => {
      const d = l.data;
      need(missing, `Authorisation ${i + 1}: regulatory status`, d.status);
      need(missing, `Authorisation ${i + 1}: licence / registration type`, d.licenceType);
      need(missing, `Authorisation ${i + 1}: jurisdiction`, d.country);
      if (d.country && !allowedCountries.has(String(d.country))) {
        missing.push(`Authorisation ${i + 1}: jurisdiction is not accepted.`);
      }
      // Permitted activities / scope remain OPTIONAL (P03).
      if (d.status !== "No authorisation required — explain") {
        need(missing, `Authorisation ${i + 1}: regulator`, d.authority);
      }
      // Licence / registration reference removed from active validation (P03).
    });
  }

  if (step >= 2 && step <= 5 && !offers.length) {
    missing.push("Select at least one product family.");
  }

  if (step === 2) {
    offers.forEach((o) => {
      const label = offerLabel(o);
      if (!(o.data.services as string[] | undefined)?.length) {
        missing.push(`${label}: select currently available services or facilities.`);
      }
      if (!(o.data.currencies as string[] | undefined)?.length) {
        missing.push(`${label}: select currencies.`);
      }
      if (
        o.family === "private" &&
        (o.data.services as string[] | undefined)?.includes("Corporate banking accounts") &&
        !o.data.corporateAccountAvailability
      ) {
        missing.push(`${label}: corporate account availability.`);
      }
    });
  }

  if (step === 3) {
    const policyConfirmed = state.core.acceptancePolicyConfirmed === true;
    const hasUpload = (state.documents?.length ?? 0) > 0;
    if (!policyConfirmed && !hasUpload) {
      const manualComplete = offers.some((o) => {
        const industries = o.data.industries as Record<number, string> | undefined;
        return industries && Object.values(industries).some((v) => v !== "unknown");
      });
      if (!manualComplete) {
        missing.push("Upload an acceptance policy or confirm extracted rules, or complete industry acceptance manually.");
      }
    }
  }

  if (step === 5) {
    if (!offers.length) {
      missing.push("Select your services in Products to complete this section.");
    } else {
      const sharedMethods = c.sharedOnboardingMethods as string[] | undefined;
      if (!sharedMethods?.length) {
        missing.push("Select at least one common onboarding method.");
      }
      const inc = c.sharedMaxIncoming;
      const out = c.sharedMaxOutgoing;
      if ((inc || out) && !c.sharedLimitCurrency) {
        missing.push("Currency for shared monthly amount limits.");
      }
    }
  }

  if (step === 7) {
    need(missing, "Contact name", c.contactName);
    need(missing, "Contact email", c.contactEmail);
    need(missing, "Contact role", c.contactRole);
    need(missing, "Email address for SOPHIMA introductions", c.referralEmail);
    const methods = c.referralMethods as string[] | undefined;
    if (!methods?.length) {
      missing.push("Accepted referral methods.");
    }
    if (methods?.includes("Provider pre-approval form")) {
      const hasFile = Boolean(c.preApprovalFileName);
      const hasLink = Boolean(String(c.preApprovalFormLink ?? "").trim());
      if (!hasFile && !hasLink) {
        missing.push("Upload the provider pre-approval form or provide the authorised form link.");
      }
    }
    if (!c.authority) missing.push("Confirm your authority to act.");
    if (!c.accuracy) missing.push("Confirm accuracy and policy updates.");
  }

  return missing;
}

const VALIDATE_STEPS = [0, 1, 2, 3, 5, 7] as const;

export function validateAllProviderSteps(state: ProviderDraftState): string[] {
  return VALIDATE_STEPS.flatMap((s) => validateProviderStep(state, s));
}

/** Group missing fields by questionnaire step for “Complete this section” links. */
export function validateAllProviderStepsGrouped(state: ProviderDraftState): StepValidationGroup[] {
  return VALIDATE_STEPS.map((step) => {
    const idx = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
    return {
      step,
      label: STEP_LABELS[idx] ?? `Step ${step}`,
      missing: validateProviderStep(state, step),
    };
  }).filter((g) => g.missing.length > 0);
}

export function validateCurrentStep(state: ProviderDraftState): string[] {
  return validateProviderStep(state, state.step);
}

export function validateIncorporationCountry(country: string) {
  return validateCountrySelection("group1", country ? [country] : []);
}

/** Recheck draft when the platform exclusion policy version advances. */
export function exclusionPolicyNeedsRecheck(state: ProviderDraftState): boolean {
  const current = getActiveCountryPolicy().version;
  return typeof state.exclusionPolicyVersion === "number" && state.exclusionPolicyVersion < current;
}

/** P02: self-declared agreement status is not verification. */
export function isAgreementVerified(state: ProviderDraftState): boolean {
  return state.core.agreementVerifiedBySophima === true;
}

export function agreementGateMessage(state: ProviderDraftState): string {
  if (isAgreementVerified(state)) {
    return "Referral agreement verified by SOPHIMA — you may continue.";
  }
  const status = String(state.core.agreement ?? "");
  if (!status || status === "Not yet arranged") {
    return "Missing agreement: arrange a referral agreement with SOPHIMA. Draft answers on this step can be saved, but Continue, submission, publication and matching stay blocked until verification.";
  }
  if (status === "In progress") {
    return "Agreement in progress: SOPHIMA must complete verification before you can continue beyond Institution.";
  }
  if (status === "Signed — status needs confirmation" || status === "Signed and current") {
    return "Unverified agreement: selecting “Signed and current” is not verification. SOPHIMA must confirm a current signed agreement before Continue, submission or matching.";
  }
  return "Referral agreement not verified by SOPHIMA.";
}

export function stepIndex(step: number): number {
  const order = [0, 1, 2, 3, 5, 7, 8];
  return order.indexOf(step);
}
