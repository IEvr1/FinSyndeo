import { FAMILIES } from "./config";
import type { ProviderDraftState } from "./types";

export function createInitialProviderState(): ProviderDraftState {
  return {
    version: 1,
    step: 0,
    core: {},
    licenses: [{ id: "lic-1", data: {} }],
    offers: [],
    current: null,
    documents: [],
  };
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
    return { ...o, data, geo: o.geo ?? {} };
  });
  return { ...state, offers };
}

export function toggleProductFamily(state: ProviderDraftState, family: string, enabled: boolean): ProviderDraftState {
  if (enabled) {
    const id = `offer-${Date.now()}`;
    const offers = [
      ...state.offers,
      { id, family, data: {}, geo: {} },
    ];
    return { ...state, offers, current: id };
  }
  const offers = state.offers.filter((o) => o.family !== family);
  return { ...state, offers, current: offers[0]?.id ?? null };
}

export function currentOffer(state: ProviderDraftState) {
  return state.offers.find((o) => o.id === state.current) ?? state.offers[0] ?? null;
}
