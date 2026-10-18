import { getActiveCountryPolicy } from "@/lib/country-policy";
import type { ProviderDraftState, ProviderOffer } from "./types";

export function createInitialProviderState(): ProviderDraftState {
  return {
    version: 1,
    step: 0,
    core: {},
    licenses: [{ id: "lic-1", data: {} }],
    offers: [],
    current: null,
    documents: [],
    exclusionPolicyVersion: getActiveCountryPolicy().version,
  };
}

export function isOfferActive(offer: ProviderOffer): boolean {
  return offer.active !== false;
}

/** Offers selected for matching / product sections (active only). */
export function activeOffers(state: ProviderDraftState): ProviderOffer[] {
  return state.offers.filter(isOfferActive);
}

export function ensureOfferArrays(state: ProviderDraftState): ProviderDraftState {
  const offers = state.offers.map((o) => {
    const data = { ...o.data };
    for (const k of [
      "services",
      "licenses",
      "currencies",
      "languages",
      "paymentMethods",
      "ibanCountries",
      "onboardingMethods",
      "rails",
      "underlyingTypes",
      "complianceRequirements",
      "schemes",
      "settlementCurrencies",
      "stages",
    ]) {
      if (data[k] !== undefined && !Array.isArray(data[k])) data[k] = [];
    }
    return { ...o, active: o.active !== false, data, geo: o.geo ?? {} };
  });
  return {
    ...state,
    offers,
    exclusionPolicyVersion: state.exclusionPolicyVersion ?? getActiveCountryPolicy().version,
  };
}

/**
 * Soft-toggle product families: unselected families stay in the draft (answers preserved)
 * but are marked inactive and excluded from matching until re-selected.
 */
export function toggleProductFamily(state: ProviderDraftState, family: string, enabled: boolean): ProviderDraftState {
  const existing = state.offers.find((o) => o.family === family);
  if (enabled) {
    if (existing) {
      const offers = state.offers.map((o) => (o.family === family ? { ...o, active: true } : o));
      return { ...state, offers, current: existing.id };
    }
    const id = `offer-${Date.now()}`;
    const offers = [...state.offers, { id, family, active: true, data: {}, geo: {} }];
    return { ...state, offers, current: id };
  }
  const offers = state.offers.map((o) => (o.family === family ? { ...o, active: false } : o));
  const nextCurrent = offers.find((o) => isOfferActive(o))?.id ?? null;
  return { ...state, offers, current: nextCurrent };
}

export function currentOffer(state: ProviderDraftState) {
  const active = activeOffers(state);
  return active.find((o) => o.id === state.current) ?? active[0] ?? null;
}
