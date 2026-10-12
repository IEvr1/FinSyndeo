import { axesForFamily } from "./geo";
import type { ProviderDraftState } from "./types";
import { FAMILIES } from "./config";

function need(missing: string[], label: string, value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    missing.push(label);
  }
}

export function validateProviderStep(state: ProviderDraftState, step: number): string[] {
  const missing: string[] = [];
  const c = state.core;

  if (step === 0) {
    need(missing, "Registered institution name", c.legalName);
    need(missing, "Incorporation country", c.country);
    need(missing, "Registration number", c.registration);
    need(missing, "Institution type", c.type);
    need(missing, "Website", c.website);
    need(missing, "Operating year", c.founded);
    need(missing, "Referral agreement status", c.agreement);
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
      need(missing, `Authorisation ${i + 1}: permitted activities`, d.scope);
      if (d.status !== "No authorisation required — explain") {
        need(missing, `Authorisation ${i + 1}: regulator`, d.authority);
      }
      if (!["No authorisation required — explain", "Application pending"].includes(String(d.status))) {
        need(missing, `Authorisation ${i + 1}: reference number`, d.number);
        need(missing, `Authorisation ${i + 1}: register entry`, d.register);
      }
    });
  }

  if (step >= 2 && step <= 5 && !state.offers.length) {
    missing.push("Select at least one product family.");
  }

  if (step === 2) {
    state.offers.forEach((o) => {
      need(missing, `${FAMILIES[o.family]}: product name`, o.data.name);
      if (!(o.data.services as string[] | undefined)?.length) {
        missing.push(`${o.data.name || FAMILIES[o.family]}: select services.`);
      }
      if (!(o.data.currencies as string[] | undefined)?.length) {
        missing.push(`${o.data.name || FAMILIES[o.family]}: select available currencies.`);
      }
    });
  }

  if (step === 3) {
    state.offers.forEach((o) => {
      if (o.family !== "private") {
        need(missing, "Physical operating offices policy", o.data.officePolicy);
        need(missing, "Employee requirement", o.data.employeeRequired);
      }
      const industries = o.data.industries as Record<string, string> | undefined;
      if (!industries || !Object.values(industries).some((v) => v !== "unknown")) {
        missing.push(`${o.data.name}: define industry acceptance.`);
      }
      axesForFamily(o.family).forEach(([id, label]) => {
        const g = o.geo?.[id];
        if (!g || (g.default === "unknown" && !Object.values(g.exceptions ?? {}).some((v) => v !== "unknown"))) {
          missing.push(`${o.data.name}: define ${label.toLowerCase()} policy.`);
        }
      });
    });
  }

  if (step === 5) {
    state.offers.forEach((o) => {
      need(missing, `${o.data.name}: physical presentation of legalised documents`, o.data.physicalDocs);
      if (!(o.data.onboardingMethods as string[] | undefined)?.length) {
        missing.push(`${o.data.name}: select an onboarding method.`);
      }
      need(missing, `${o.data.name}: confirm product limit disclosure`, o.data.limitDisclosure);
    });
  }

  if (step === 7) {
    need(missing, "Contact name", c.contactName);
    need(missing, "Contact email", c.contactEmail);
    need(missing, "Contact role", c.contactRole);
    need(missing, "Preferred referral channel", c.referralChannel);
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

export function stepIndex(step: number): number {
  const order = [0, 1, 2, 3, 5, 7, 8];
  return order.indexOf(step);
}
