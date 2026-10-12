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
    offers: state.offers.map((o) => ({
      id: o.id,
      family: o.family,
      geo: o.geo ?? {},
      data: o.data,
    })),
    wizard: {
      step: state.step,
      currentOfferId: state.current,
    },
  };
}
