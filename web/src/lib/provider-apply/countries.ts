import { getSelectableCountries } from "@/lib/country-policy";

/** Incorporation and authorisation jurisdictions permitted under group-1 exclusion policy. */
export function providerJurisdictionOptions(): string[] {
  return getSelectableCountries("group1");
}
