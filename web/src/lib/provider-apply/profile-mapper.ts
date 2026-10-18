import type { ProviderDraftState } from "./types";

export function providerStateToProfileData(state: ProviderDraftState, provider: { id: string; code: string }) {
  return {
    id: `draft-${provider.id}`,
    version: 1,
    approvalStatus: "draft",
    core: {
      ...state.core,
      legalName: state.core.legalName,
      country: state.core.country,
      agreement: state.core.agreement,
    },
    licenses: state.licenses,
    documents: state.documents.map((d) => ({ ...d, visibility: d.visibility ?? "SOPHIMA only" })),
    offers: state.offers
      .filter((o) => o.active !== false)
      .map((o) => ({
        id: o.id,
        family: o.family,
        geo: o.geo ?? {},
        data: o.data,
      })),
    draftOffers: state.offers.map((o) => ({
      id: o.id,
      family: o.family,
      active: o.active !== false,
      geo: o.geo ?? {},
      data: o.data,
    })),
    exclusionPolicyVersion: state.exclusionPolicyVersion,
    wizard: {
      step: state.step,
      currentOfferId: state.current,
    },
  };
}
