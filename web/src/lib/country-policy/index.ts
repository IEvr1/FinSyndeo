import countries from "@/data/countries.json";

export type CountryPolicyGroup = "group1" | "group2";

export type CountryPolicyVersion = {
  version: number;
  group1Exclusions: string[];
  published: boolean;
  effectiveFrom?: string;
};

/** Production policy starts empty — Russia/Iran sample is NOT loaded per spec. */
const DEFAULT_POLICY: CountryPolicyVersion = {
  version: 0,
  group1Exclusions: [],
  published: false,
};

let activePolicy: CountryPolicyVersion = DEFAULT_POLICY;

export function setActiveCountryPolicy(policy: CountryPolicyVersion): void {
  activePolicy = policy;
}

export function getActiveCountryPolicy(): CountryPolicyVersion {
  return activePolicy;
}

export function getAllCountries(): string[] {
  return countries as string[];
}

export function getSelectableCountries(group: CountryPolicyGroup): string[] {
  const all = getAllCountries();
  if (group === "group2") {
    return all;
  }
  const excluded = new Set(activePolicy.group1Exclusions);
  return all.filter((c) => !excluded.has(c));
}

export function validateCountrySelection(
  group: CountryPolicyGroup,
  values: string[]
): { valid: boolean; rejected: string[]; message?: string } {
  const allowed = new Set(getSelectableCountries(group));
  const rejected = values.filter((v) => !allowed.has(v));
  if (rejected.length > 0) {
    return {
      valid: false,
      rejected,
      message: `Countries excluded under SOPHIMA policy cannot be selected for ${group === "group1" ? "incorporation or payment flows" : "this dimension"}.`,
    };
  }
  return { valid: true, rejected: [] };
}

export function isCountryPolicyPublished(): boolean {
  return activePolicy.published;
}
