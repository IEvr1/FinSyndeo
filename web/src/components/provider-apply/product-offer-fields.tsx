"use client";

import {
  CheckGroup,
  FieldInput,
  FieldSelect,
  FieldTextarea,
} from "@/components/provider-apply/form-controls";
import {
  BAAS_DESCRIPTION,
  CORPORATE_ACCOUNT_AVAILABILITY,
  CURRENCY_OPTIONS,
  FAMILIES,
  MERCHANT_CRYPTO_SERVICES,
  SERVICES,
  currenciesLegend,
  servicesLegend,
} from "@/lib/provider-apply/config";
import type { ProviderDraftState, ProviderOffer } from "@/lib/provider-apply/types";

function str(v: unknown): string {
  return String(v ?? "");
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

type PatchFn = (s: ProviderDraftState, offerId: string, patch: Record<string, unknown>) => ProviderDraftState;

type Props = {
  offer: ProviderOffer;
  setState: React.Dispatch<React.SetStateAction<ProviderDraftState>>;
  patchOffer: PatchFn;
};

function toggleService(
  setState: React.Dispatch<React.SetStateAction<ProviderDraftState>>,
  patchOffer: PatchFn,
  offerId: string,
  value: string,
  checked: boolean,
  current: string[]
) {
  const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
  setState((s) => patchOffer(s, offerId, { services: next }));
}

export function ProductOfferFields({ offer: o, setState, patchOffer }: Props) {
  const services = arr(o.data.services);
  const merchantCore = SERVICES.merchant.filter((s) => !MERCHANT_CRYPTO_SERVICES.includes(s));
  const merchantCrypto = services.filter((s) => MERCHANT_CRYPTO_SERVICES.includes(s));
  const showCorporateUbo = o.family === "private" && services.includes("Corporate banking accounts");

  const clientPaymentSelected =
    o.family === "correspondent" &&
    services.some((s) =>
      [
        "Accounts for receiving and sending payments on behalf of clients",
        "Accounts for holding client funds",
        "Accounts specifically for safeguarding the applicant's client funds",
      ].includes(s)
    );

  const holdingSelected =
    o.family === "correspondent" &&
    services.some((s) =>
      [
        "Accounts for holding client funds",
        "Accounts specifically for safeguarding the applicant's client funds",
      ].includes(s)
    );

  return (
    <section className="product-offer-section" aria-labelledby={`offer-${o.id}`}>
      <h2 id={`offer-${o.id}`}>{FAMILIES[o.family]}</h2>
      <p className="hint">Select only {o.family === "bank" || o.family === "finance" ? "facilities" : "services"} currently available.</p>

      {o.family === "merchant" ? (
        <>
          <CheckGroup
            legend={servicesLegend(o.family)}
            options={merchantCore}
            values={services}
            onToggle={(value, checked) => toggleService(setState, patchOffer, o.id, value, checked, services)}
          />
          <details className="panel" style={{ marginTop: 12 }}>
            <summary>Crypto-related payment services</summary>
            <CheckGroup
              legend="Crypto-related payment services"
              options={MERCHANT_CRYPTO_SERVICES}
              values={merchantCrypto}
              onToggle={(value, checked) => {
                const base = services.filter((s) => !MERCHANT_CRYPTO_SERVICES.includes(s));
                const crypto = merchantCrypto;
                const nextCrypto = checked ? [...new Set([...crypto, value])] : crypto.filter((x) => x !== value);
                setState((s) => patchOffer(s, o.id, { services: [...base, ...nextCrypto] }));
              }}
            />
          </details>
        </>
      ) : (
        <CheckGroup
          legend={servicesLegend(o.family)}
          options={SERVICES[o.family] ?? []}
          values={services}
          onToggle={(value, checked) => toggleService(setState, patchOffer, o.id, value, checked, services)}
        />
      )}

      {services.includes("Other — please specify") && (
        <FieldInput
          label="Other — please specify"
          value={str(o.data.servicesOther)}
          onChange={(v) => setState((s) => patchOffer(s, o.id, { servicesOther: v }))}
        />
      )}

      {o.family === "correspondent" && services.includes("Banking as a Service (BaaS)") && (
        <div className="notice">
          <strong>Banking as a Service (BaaS)</strong>
          <p className="hint" style={{ marginBottom: 0 }}>
            {BAAS_DESCRIPTION}
          </p>
        </div>
      )}

      {o.family === "bank" &&
        services.includes("Dedicated client-funds / safeguarding accounts") &&
        !services.includes("Operating / commercial bank accounts") && (
          <p className="hint">
            Dedicated client-funds support is declared separately from operating accounts and is not implied by
            operating-account acceptance.
          </p>
        )}

      {showCorporateUbo && (
        <>
          <FieldSelect
            label="Corporate banking accounts — availability"
            value={str(o.data.corporateAccountAvailability)}
            options={CORPORATE_ACCOUNT_AVAILABILITY}
            required
            onChange={(v) => setState((s) => patchOffer(s, o.id, { corporateAccountAvailability: v }))}
          />
          {["Offered only if a UBO first opens a personal account", "Case-by-case"].includes(
            str(o.data.corporateAccountAvailability)
          ) && (
            <FieldTextarea
              label="Corporate account conditions (optional)"
              value={str(o.data.corporateAccountConditions)}
              placeholder="Which UBOs must open personal accounts and any additional requirements."
              onChange={(v) => setState((s) => patchOffer(s, o.id, { corporateAccountConditions: v }))}
            />
          )}
        </>
      )}

      {clientPaymentSelected && (
        <CheckGroup
          legend="Whose payments or funds can the applicant handle? Select all that apply."
          options={[
            "Its own individual and business clients",
            "Other financial institutions and their underlying clients — downstream / nested arrangements",
            "Other — please specify",
          ]}
          values={arr(o.data.clientFundsScope)}
          onToggle={(value, checked) => {
            const current = arr(o.data.clientFundsScope);
            const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
            setState((s) => patchOffer(s, o.id, { clientFundsScope: next }));
          }}
        />
      )}

      {arr(o.data.clientFundsScope).includes(
        "Other financial institutions and their underlying clients — downstream / nested arrangements"
      ) && (
        <FieldTextarea
          label="Permitted financial-institution types and approval conditions"
          value={str(o.data.downstreamConditions)}
          required
          onChange={(v) => setState((s) => patchOffer(s, o.id, { downstreamConditions: v }))}
        />
      )}

      {holdingSelected && (
        <>
          <CheckGroup
            legend="How can those funds be held? Select all that apply."
            options={[
              "Separate accounts for each underlying client",
              "Sub-accounts within a main account",
              "Pooled / omnibus account with individual balances recorded internally",
              "Other — please specify",
            ]}
            values={arr(o.data.fundHoldingStructure)}
            onToggle={(value, checked) => {
              const current = arr(o.data.fundHoldingStructure);
              const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
              setState((s) => patchOffer(s, o.id, { fundHoldingStructure: next }));
            }}
          />
          {services.includes("Accounts specifically for safeguarding the applicant's client funds") && (
            <FieldTextarea
              label="Safeguarding conditions"
              value={str(o.data.safeguardingConditions)}
              onChange={(v) => setState((s) => patchOffer(s, o.id, { safeguardingConditions: v }))}
            />
          )}
        </>
      )}

      <CheckGroup
        legend={currenciesLegend(o.family)}
        options={CURRENCY_OPTIONS}
        values={arr(o.data.currencies)}
        onToggle={(value, checked) => {
          const current = arr(o.data.currencies);
          const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
          setState((s) => patchOffer(s, o.id, { currencies: next }));
        }}
      />
      {arr(o.data.currencies).includes("Other") && (
        <FieldInput
          label="Other currency codes"
          value={str(o.data.otherCurrencies)}
          onChange={(v) => setState((s) => patchOffer(s, o.id, { otherCurrencies: v }))}
        />
      )}

      <PlannedEntries offer={o} setState={setState} patchOffer={patchOffer} kind={o.family === "bank" || o.family === "finance" ? "facility" : "service"} />
    </section>
  );
}

function PlannedEntries({
  offer: o,
  setState,
  patchOffer,
  kind,
}: {
  offer: ProviderOffer;
  setState: React.Dispatch<React.SetStateAction<ProviderDraftState>>;
  patchOffer: PatchFn;
  kind: "facility" | "service";
}) {
  const entries = (o.data.planned as Array<Record<string, string>> | undefined) ?? [];
  const label = kind === "facility" ? "Planned facilities (optional)" : "Planned services (optional)";

  return (
    <div className="panel" style={{ marginTop: 20, background: "var(--soft)" }}>
      <h3 style={{ marginTop: 0, fontSize: 16 }}>{label}</h3>
      <p className="hint">Planned items do not count as available in matching until confirmed and approved by SOPHIMA.</p>
      {entries.map((row, i) => (
        <div key={i} className="grid" style={{ marginBottom: 12 }}>
          <FieldInput
            label={kind === "facility" ? "Facility" : "Service"}
            value={str(row.name)}
            onChange={(v) => {
              const next = [...entries];
              next[i] = { ...next[i], name: v };
              setState((s) => patchOffer(s, o.id, { planned: next }));
            }}
          />
          <FieldInput
            label="Expected launch (month/year)"
            value={str(row.launch)}
            placeholder="e.g. 06/2026"
            onChange={(v) => {
              const next = [...entries];
              next[i] = { ...next[i], launch: v };
              setState((s) => patchOffer(s, o.id, { planned: next }));
            }}
          />
          <FieldTextarea
            label="Comment (optional)"
            value={str(row.comment)}
            onChange={(v) => {
              const next = [...entries];
              next[i] = { ...next[i], comment: v };
              setState((s) => patchOffer(s, o.id, { planned: next }));
            }}
          />
          <button
            type="button"
            className="btn small"
            onClick={() => {
              const next = entries.filter((_, j) => j !== i);
              setState((s) => patchOffer(s, o.id, { planned: next }));
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn"
        onClick={() => setState((s) => patchOffer(s, o.id, { planned: [...entries, { name: "", launch: "", comment: "" }] }))}
      >
        Add planned {kind}
      </button>
    </div>
  );
}
