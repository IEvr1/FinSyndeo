"use client";

import { CheckGroup, FieldInput, FieldSelect } from "@/components/provider-apply/form-controls";
import { FAMILIES, ONBOARDING_METHODS } from "@/lib/provider-apply/config";
import type { ProviderDraftState, ProviderOffer } from "@/lib/provider-apply/types";

function str(v: unknown): string {
  return String(v ?? "");
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

type Props = {
  offer: ProviderOffer;
  setState: React.Dispatch<React.SetStateAction<ProviderDraftState>>;
  patchOffer: (s: ProviderDraftState, offerId: string, patch: Record<string, unknown>) => ProviderDraftState;
};

export function ProductTermsFields({ offer: o, setState, patchOffer }: Props) {
  const hasTransfers = o.family === "bank" || o.family === "correspondent" || o.family === "private";

  return (
    <section className="product-offer-section">
      <h2>{FAMILIES[o.family]} — product terms</h2>
      <CheckGroup
        legend="Relationship-manager languages available"
        options={["English", "Greek", "French", "German", "Spanish", "Italian", "Hebrew", "Arabic", "Other"]}
        values={arr(o.data.languages)}
        onToggle={(value, checked) => {
          const current = arr(o.data.languages);
          const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
          setState((s) => patchOffer(s, o.id, { languages: next }));
        }}
      />
      {arr(o.data.languages).includes("Other") && (
        <FieldInput
          label="Other languages"
          value={str(o.data.otherLanguages)}
          onChange={(v) => setState((s) => patchOffer(s, o.id, { otherLanguages: v }))}
        />
      )}
      <CheckGroup
        legend="Available onboarding methods"
        options={ONBOARDING_METHODS}
        values={arr(o.data.onboardingMethods)}
        onToggle={(value, checked) => {
          const current = arr(o.data.onboardingMethods);
          const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
          setState((s) => patchOffer(s, o.id, { onboardingMethods: next }));
        }}
      />
      {arr(o.data.onboardingMethods).includes("Other — please specify") && (
        <FieldInput
          label="Other onboarding method"
          value={str(o.data.onboardingOther)}
          onChange={(v) => setState((s) => patchOffer(s, o.id, { onboardingOther: v }))}
        />
      )}

      {hasTransfers && (
        <>
          <h3>Monthly transaction limits (optional)</h3>
          <p className="hint">Blank limits mean not specified — not zero or unlimited.</p>
          <div className="grid">
            <FieldInput
              label="Maximum incoming amount per month"
              type="number"
              value={str(o.data.maxIncoming)}
              onChange={(v) => setState((s) => patchOffer(s, o.id, { maxIncoming: v }))}
            />
            <FieldInput
              label="Maximum incoming transactions per month"
              type="number"
              value={str(o.data.maxIncomingCount)}
              onChange={(v) => setState((s) => patchOffer(s, o.id, { maxIncomingCount: v }))}
            />
            <FieldInput
              label="Maximum outgoing amount per month"
              type="number"
              value={str(o.data.maxOutgoing)}
              onChange={(v) => setState((s) => patchOffer(s, o.id, { maxOutgoing: v }))}
            />
            <FieldInput
              label="Maximum outgoing transactions per month"
              type="number"
              value={str(o.data.maxOutgoingCount)}
              onChange={(v) => setState((s) => patchOffer(s, o.id, { maxOutgoingCount: v }))}
            />
          </div>
          {(str(o.data.maxIncoming) || str(o.data.maxOutgoing)) && (
            <FieldSelect
              label="Currency for the monthly amount limits"
              value={str(o.data.limitCurrency)}
              options={["EUR", "GBP", "USD", "CHF"]}
              required
              onChange={(v) => setState((s) => patchOffer(s, o.id, { limitCurrency: v }))}
            />
          )}
        </>
      )}

      {o.family === "merchant" && (
        <div className="grid">
          <FieldInput
            label="Minimum monthly processing volume"
            type="number"
            value={str(o.data.minProcessing)}
            onChange={(v) => setState((s) => patchOffer(s, o.id, { minProcessing: v }))}
          />
          <FieldInput
            label="Maximum monthly processing volume"
            type="number"
            value={str(o.data.maxProcessing)}
            onChange={(v) => setState((s) => patchOffer(s, o.id, { maxProcessing: v }))}
          />
        </div>
      )}
    </section>
  );
}
