import { getSelectableCountries } from "@/lib/country-policy";

/** Non-country catalogue labels that must never appear in provider selectors (P01 / A07). */
const CATALOGUE_NON_COUNTRIES = new Set(["Caribbean", "World"]);

/** Incorporation and authorisation jurisdictions permitted under group-1 exclusion policy. */
export function providerJurisdictionOptions(): string[] {
  return getSelectableCountries("group1").filter((c) => !CATALOGUE_NON_COUNTRIES.has(c));
}
