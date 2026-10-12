export type GeoAxisRule = {
  default: string;
  exceptions: Record<string, string>;
};

export type ProviderLicense = {
  id: string;
  data: Record<string, unknown>;
};

export type ProviderOffer = {
  id: string;
  family: string;
  data: Record<string, unknown>;
  geo?: Record<string, GeoAxisRule>;
  axis?: string;
};

export type ProviderDraftState = {
  version: 1;
  step: number;
  core: Record<string, unknown>;
  licenses: ProviderLicense[];
  offers: ProviderOffer[];
  current: string | null;
  documents: Array<Record<string, unknown>>;
};
