import type { ProviderDraftState } from "./types";
import { FAMILIES } from "./config";
import { providerJurisdictionOptions } from "./countries";
import { validateCountrySelection } from "@/lib/country-policy";

function need(missing: string[], label: string, value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    missing.push(label);
  }
}

function offerLabel(o: { family: string; data: Record<string, unknown> }) {
  return FAMILIES[o.family] ?? o.family;
}

export function validateProviderStep(state: ProviderDraftState, step: number): string[] {
  const missing: string[] = [];
  const c = state.core;
  const allowedCountries = new Set(providerJurisdictionOptions());

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
  }

  if (step === 1) {
    state.licenses.forEach((l, i) => {
      const d = l.data;
      need(missing, `Authorisation ${i + 1}: regulatory status`, d.status);
      need(missing, `Authorisation ${i + 1}: legal holder`, d.holder);
      need(missing, `Authorisation ${i + 1}: jurisdiction`, d.country);
      if (d.country && !allowedCountries.has(String(d.country))) {
        missing.push(`Authorisation ${i + 1}: jurisdiction is not accepted.`);
      }
      need(missing, `Authorisation ${i + 1}: permitted activities`, d.scope);
      if (d.status !== "No authorisation required — explain") {
        need(missing, `Authorisation ${i + 1}: regulator`, d.authority);
      }
      if (!["No authorisation required — explain", "Application pending"].includes(String(d.status))) {
        need(missing, `Authorisation ${i + 1}: reference number`, d.number);
      }
    });
  }

  if (step >= 2 && step <= 5 && !state.offers.length) {
    missing.push("Select at least one product family.");
  }

  if (step === 2) {
    state.offers.forEach((o) => {
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
      const manualComplete = state.offers.some((o) => {
        const industries = o.data.industries as Record<number, string> | undefined;
        return industries && Object.values(industries).some((v) => v !== "unknown");
      });
      if (!manualComplete) {
        missing.push("Upload an acceptance policy or confirm extracted rules, or complete industry acceptance manually.");
      }
    }
  }

  if (step === 5) {
    state.offers.forEach((o) => {
      const label = offerLabel(o);
      if (!(o.data.onboardingMethods as string[] | undefined)?.length) {
        missing.push(`${label}: select an onboarding method.`);
      }
      const inc = o.data.maxIncoming;
      const out = o.data.maxOutgoing;
      if ((inc || out) && !o.data.limitCurrency) {
        missing.push(`${label}: currency for monthly amount limits.`);
      }
    });
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
    if (!c.authority) missing.push("Confirm your authority to act.");
    if (!c.accuracy) missing.push("Confirm accuracy and policy updates.");
  }

  return missing;
}

export function validateAllProviderSteps(state: ProviderDraftState): string[] {
  return [0, 1, 2, 3, 5, 7].flatMap((s) => validateProviderStep(state, s));
}

export function validateCurrentStep(state: ProviderDraftState): string[] {
  return validateProviderStep(state, state.step);
}

export function validateIncorporationCountry(country: string) {
  return validateCountrySelection("group1", country ? [country] : []);
}

export function stepIndex(step: number): number {
  const order = [0, 1, 2, 3, 5, 7, 8];
  return order.indexOf(step);
}
