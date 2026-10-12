"use client";

import {
  CheckGroup,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  GeoAxisEditor,
  StatusMatrix,
} from "@/components/provider-apply/form-controls";
import {
  ENTITY_TYPES,
  FAMILIES,
  INDUSTRIES,
  INSTITUTION_TYPES,
  PROVIDER_COUNTRIES,
  RISK_CATEGORIES,
  SERVICES,
} from "@/lib/provider-apply/config";
import { axesForFamily } from "@/lib/provider-apply/geo";
import { currentOffer, toggleProductFamily } from "@/lib/provider-apply/state";
import type { ProviderDraftState, ProviderOffer } from "@/lib/provider-apply/types";

type Props = {
  state: ProviderDraftState;
  setState: React.Dispatch<React.SetStateAction<ProviderDraftState>>;
};

function str(v: unknown): string {
  return String(v ?? "");
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

function patchCore(state: ProviderDraftState, key: string, value: unknown): ProviderDraftState {
  return { ...state, core: { ...state.core, [key]: value } };
}

function patchOffer(state: ProviderDraftState, offerId: string, patch: Record<string, unknown>): ProviderDraftState {
  return {
    ...state,
    offers: state.offers.map((o) =>
      o.id === offerId ? { ...o, data: { ...o.data, ...patch } } : o
    ),
  };
}

function patchOfferGeo(state: ProviderDraftState, offerId: string, geo: ProviderOffer["geo"]): ProviderDraftState {
  return {
    ...state,
    offers: state.offers.map((o) => (o.id === offerId ? { ...o, geo } : o)),
  };
}

export function ProviderApplyContent({ state, setState }: Props) {
  const step = state.step;
  const offer = currentOffer(state);
  const o = offer;

  if (step === 0) {
    return (
      <>
        <section className="panel">
          <div className="grid">
            <FieldInput
              label="Registered institution name"
              value={str(state.core.legalName)}
              required
              onChange={(v) => setState((s) => patchCore(s, "legalName", v))}
            />
            <FieldInput
              label="Trading / brand name"
              value={str(state.core.brand)}
              onChange={(v) => setState((s) => patchCore(s, "brand", v))}
            />
            <FieldSelect
              label="Country / jurisdiction of incorporation"
              value={str(state.core.country)}
              options={PROVIDER_COUNTRIES}
              required
              onChange={(v) => setState((s) => patchCore(s, "country", v))}
            />
            <FieldInput
              label="Company registration number"
              value={str(state.core.registration)}
              required
              onChange={(v) => setState((s) => patchCore(s, "registration", v))}
            />
            <FieldSelect
              label="Primary institution type"
              value={str(state.core.type)}
              options={[...INSTITUTION_TYPES, "Investment firm / private bank", "Lender / financing provider"]}
              required
              onChange={(v) => setState((s) => patchCore(s, "type", v))}
            />
            <FieldInput
              label="Institution website"
              type="url"
              value={str(state.core.website)}
              required
              onChange={(v) => setState((s) => patchCore(s, "website", v))}
            />
            <FieldInput
              label="Year the institution began operating"
              type="number"
              value={str(state.core.founded)}
              required
              onChange={(v) => setState((s) => patchCore(s, "founded", v))}
            />
            <FieldInput
              label="Group / parent institution, if applicable"
              value={str(state.core.group)}
              onChange={(v) => setState((s) => patchCore(s, "group", v))}
            />
          </div>
        </section>
        <section className="panel">
          <h2>Referral agreement</h2>
          <FieldSelect
            label="Referral agreement with SOPHIMA"
            value={str(state.core.agreement)}
            options={[
              "Signed and current",
              "Signed — status needs confirmation",
              "In progress",
              "Not yet arranged",
            ]}
            required
            onChange={(v) => setState((s) => patchCore(s, "agreement", v))}
          />
          <FieldInput
            label="Agreement reference or date, if known"
            value={str(state.core.agreementRef)}
            onChange={(v) => setState((s) => patchCore(s, "agreementRef", v))}
          />
          <p className="hint">
            You can prepare your profile now. Listing requires a current signed referral agreement verified by SOPHIMA.
          </p>
        </section>
      </>
    );
  }

  if (step === 1) {
    return (
      <section className="panel">
        <h2>Authorisations</h2>
        <p className="hint">Add each relevant licence, registration or notification.</p>
        {state.licenses.map((lic) => (
          <div key={lic.id} className="summary-card">
            <div className="grid">
              <FieldSelect
                label="Regulatory status"
                value={str(lic.data.status)}
                options={[
                  "Authorised / licensed",
                  "Registered",
                  "SRO membership",
                  "Article 60 MiCA notification",
                  "Application pending",
                  "No authorisation required — explain",
                ]}
                required
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    licenses: s.licenses.map((l) =>
                      l.id === lic.id ? { ...l, data: { ...l.data, status: v } } : l
                    ),
                  }))
                }
              />
              <FieldInput
                label="Legal name of licence / registration holder"
                value={str(lic.data.holder)}
                required
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    licenses: s.licenses.map((l) =>
                      l.id === lic.id ? { ...l, data: { ...l.data, holder: v } } : l
                    ),
                  }))
                }
              />
              <FieldInput
                label="Regulator / issuing authority"
                value={str(lic.data.authority)}
                required
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    licenses: s.licenses.map((l) =>
                      l.id === lic.id ? { ...l, data: { ...l.data, authority: v } } : l
                    ),
                  }))
                }
              />
              <FieldSelect
                label="Authorisation jurisdiction"
                value={str(lic.data.country)}
                options={PROVIDER_COUNTRIES}
                required
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    licenses: s.licenses.map((l) =>
                      l.id === lic.id ? { ...l, data: { ...l.data, country: v } } : l
                    ),
                  }))
                }
              />
            </div>
            <FieldInput
              label="Licence / registration / notification reference"
              value={str(lic.data.number)}
              required
              onChange={(v) =>
                setState((s) => ({
                  ...s,
                  licenses: s.licenses.map((l) =>
                    l.id === lic.id ? { ...l, data: { ...l.data, number: v } } : l
                  ),
                }))
              }
            />
            <FieldInput
              label="Official register entry"
              type="url"
              value={str(lic.data.register)}
              required
              onChange={(v) =>
                setState((s) => ({
                  ...s,
                  licenses: s.licenses.map((l) =>
                    l.id === lic.id ? { ...l, data: { ...l.data, register: v } } : l
                  ),
                }))
              }
            />
            <FieldTextarea
              label="Permitted activities / authorisation scope"
              value={str(lic.data.scope)}
              required
              onChange={(v) =>
                setState((s) => ({
                  ...s,
                  licenses: s.licenses.map((l) =>
                    l.id === lic.id ? { ...l, data: { ...l.data, scope: v } } : l
                  ),
                }))
              }
            />
            {state.licenses.length > 1 && (
              <button
                type="button"
                className="small"
                onClick={() =>
                  setState((s) => ({ ...s, licenses: s.licenses.filter((l) => l.id !== lic.id) }))
                }
              >
                Remove authorisation
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          id="add-license"
          onClick={() =>
            setState((s) => ({
              ...s,
              licenses: [...s.licenses, { id: `lic-${Date.now()}`, data: {} }],
            }))
          }
        >
          Add another authorisation
        </button>
      </section>
    );
  }

  if (step === 2) {
    return (
      <>
        <section className="panel">
          <p className="hint">Select the product families provided directly by your institution.</p>
          <div className="checks">
            {Object.entries(FAMILIES).map(([id, label]) => (
              <label key={id} className="service-card">
                <input
                  type="checkbox"
                  checked={state.offers.some((x) => x.family === id)}
                  onChange={(e) => setState((s) => toggleProductFamily(s, id, e.target.checked))}
                />
                <span>
                  <b>{label}</b>
                </span>
              </label>
            ))}
          </div>
        </section>
        {state.offers.length > 0 && (
          <div className="offer-switch" aria-label="Product profiles">
            {state.offers.map((x) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={x.id === offer?.id}
                onClick={() => setState((s) => ({ ...s, current: x.id }))}
              >
                {str(x.data.name) || FAMILIES[x.family]}
              </button>
            ))}
          </div>
        )}
        {o && (
          <section className="panel">
            <FieldInput
              label="Product / account name"
              value={str(o.data.name)}
              required
              onChange={(v) => setState((s) => patchOffer(s, o.id, { name: v }))}
            />
            <CheckGroup
              legend={
                o.family === "finance"
                  ? "Financing facilities for:"
                  : o.family === "merchant"
                    ? "Acquiring services offered:"
                    : "Our accounts can be used for, or provide:"
              }
              options={SERVICES[o.family] ?? []}
              values={arr(o.data.services)}
              onToggle={(value, checked) => {
                setState((s) => {
                  const current = arr(currentOffer(s)?.data.services);
                  const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
                  return patchOffer(s, o.id, { services: next });
                });
              }}
            />
            <CheckGroup
              legend="Available currencies"
              options={["EUR", "GBP", "USD", "CHF", "Other"]}
              values={arr(o.data.currencies)}
              onToggle={(value, checked) => {
                setState((s) => {
                  const current = arr(currentOffer(s)?.data.currencies);
                  const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
                  return patchOffer(s, o.id, { currencies: next });
                });
              }}
            />
            {arr(o.data.currencies).includes("Other") && (
              <FieldInput
                label="Other currency codes"
                value={str(o.data.otherCurrencies)}
                onChange={(v) => setState((s) => patchOffer(s, o.id, { otherCurrencies: v }))}
              />
            )}
            <label className="checkline">
              <input
                type="checkbox"
                checked={o.data.capabilitiesComplete === true}
                onChange={(e) =>
                  setState((s) => patchOffer(s, o.id, { capabilitiesComplete: e.target.checked }))
                }
              />
              <span>
                The selected capabilities are the full current capability list for this product.
              </span>
            </label>
          </section>
        )}
      </>
    );
  }

  if (step === 3 && o) {
    const industries = (o.data.industries as Record<number, string>) ?? {};
    const entities = (o.data.entities as Record<number, string>) ?? {};
    const risk = (o.data.risk as Record<number, string>) ?? {};
    const axis = o.axis ?? axesForFamily(o.family)[0]?.[0] ?? "incorporation";

    return (
      <>
        <section className="panel">
          <p className="notice">
            Use the approved two-group country policy editor for production revisions. Below is the profile data
            editor retained from the Institution Apply prototype.
          </p>
        </section>
        <GeoAxisEditor
          family={o.family}
          offerId={o.id}
          geo={o.geo ?? {}}
          axis={axis}
          onAxis={(nextAxis) =>
            setState((s) => ({
              ...s,
              offers: s.offers.map((x) => (x.id === o.id ? { ...x, axis: nextAxis } : x)),
            }))
          }
          onUpdate={(geo) => setState((s) => patchOfferGeo(s, o.id, geo))}
        />
        <StatusMatrix
          title={o.family === "private" ? "Business / wealth-generating sectors" : "Industry acceptance"}
          options={INDUSTRIES}
          values={industries}
          onChange={(i, status) =>
            setState((s) => patchOffer(s, o.id, { industries: { ...industries, [i]: status } }))
          }
        />
        {o.family !== "private" && (
          <StatusMatrix
            title="Legal entities accepted"
            options={ENTITY_TYPES}
            values={entities}
            onChange={(i, status) =>
              setState((s) => patchOffer(s, o.id, { entities: { ...entities, [i]: status } }))
            }
          />
        )}
        <section className="panel">
          <FieldSelect
            label="Physical operating offices required?"
            value={str(o.data.officePolicy)}
            options={["In incorporation country", "In an accepted operating country", "Case-by-case", "Not normally required"]}
            required
            onChange={(v) => setState((s) => patchOffer(s, o.id, { officePolicy: v }))}
          />
          <FieldSelect
            label="Must the applicant employ at least one person other than a director?"
            value={str(o.data.employeeRequired)}
            options={["Yes", "No", "Case-by-case"]}
            required
            onChange={(v) => setState((s) => patchOffer(s, o.id, { employeeRequired: v }))}
          />
        </section>
        <StatusMatrix
          title="Profiles needing specific consideration"
          options={
            o.family === "private"
              ? RISK_CATEGORIES.filter((v) =>
                  [
                    "PEPs or connected persons",
                    "Third-party funds",
                    "Crypto-related funds or customers",
                    "Higher-risk country exposure — where legally permitted",
                  ].includes(v)
                )
              : RISK_CATEGORIES
          }
          values={risk}
          onChange={(i, status) =>
            setState((s) => patchOffer(s, o.id, { risk: { ...risk, [i]: status } }))
          }
        />
      </>
    );
  }

  if (step === 5 && o) {
    return (
      <section className="panel">
        <CheckGroup
          legend="Client / relationship-manager languages"
          options={["English", "Greek", "French", "German", "Spanish", "Italian", "Hebrew", "Arabic", "Other"]}
          values={arr(o.data.languages)}
          onToggle={(value, checked) => {
            setState((s) => {
              const current = arr(currentOffer(s)?.data.languages);
              const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
              return patchOffer(s, o.id, { languages: next });
            });
          }}
        />
        <CheckGroup
          legend="Available onboarding methods"
          options={[
            "Fully remote",
            "Remote with video identification",
            "Remote with online identification",
            "Remote with video interview identification",
            "In person",
          ]}
          values={arr(o.data.onboardingMethods)}
          onToggle={(value, checked) => {
            setState((s) => {
              const current = arr(currentOffer(s)?.data.onboardingMethods);
              const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
              return patchOffer(s, o.id, { onboardingMethods: next });
            });
          }}
        />
        <FieldSelect
          label="Must legalised documents be presented physically?"
          value={str(o.data.physicalDocs)}
          options={["Yes", "No", "Case-by-case"]}
          required
          onChange={(v) => setState((s) => patchOffer(s, o.id, { physicalDocs: v }))}
        />
        <FieldSelect
          label="Are all applicable numeric product restrictions recorded?"
          value={str(o.data.limitDisclosure)}
          options={[
            ["unconfirmed", "Not yet complete — blank limits remain unconfirmed"],
            ["complete", "Complete — any blank numeric limit is unrestricted for this product"],
          ]}
          required
          onChange={(v) => setState((s) => patchOffer(s, o.id, { limitDisclosure: v }))}
        />
        {o.family === "bank" || o.family === "correspondent" ? (
          <div className="grid">
            <FieldInput
              label="Maximum incoming amount per month"
              type="number"
              value={str(o.data.maxIncoming)}
              onChange={(v) => setState((s) => patchOffer(s, o.id, { maxIncoming: v }))}
            />
            <FieldInput
              label="Maximum outgoing amount per month"
              type="number"
              value={str(o.data.maxOutgoing)}
              onChange={(v) => setState((s) => patchOffer(s, o.id, { maxOutgoing: v }))}
            />
          </div>
        ) : null}
        {o.family === "merchant" ? (
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
        ) : null}
      </section>
    );
  }

  if (step === 7) {
    return (
      <>
        <section className="panel">
          <h2>Contact & referrals</h2>
          <div className="grid">
            <FieldInput
              label="Contact name"
              value={str(state.core.contactName)}
              required
              onChange={(v) => setState((s) => patchCore(s, "contactName", v))}
            />
            <FieldInput
              label="Contact email"
              type="email"
              value={str(state.core.contactEmail)}
              required
              onChange={(v) => setState((s) => patchCore(s, "contactEmail", v))}
            />
            <FieldInput
              label="Role / relationship to institution"
              value={str(state.core.contactRole)}
              required
              onChange={(v) => setState((s) => patchCore(s, "contactRole", v))}
            />
            <FieldInput
              label="Contact phone"
              value={str(state.core.contactPhone)}
              onChange={(v) => setState((s) => patchCore(s, "contactPhone", v))}
            />
          </div>
          <FieldInput
            label="Preferred referral channel / onboarding link"
            value={str(state.core.referralChannel)}
            required
            onChange={(v) => setState((s) => patchCore(s, "referralChannel", v))}
          />
        </section>
        <section className="panel">
          <h2>Why clients choose you</h2>
          <FieldTextarea
            label="Distinctive benefits / strengths"
            value={str(state.core.benefits)}
            onChange={(v) => setState((s) => patchCore(s, "benefits", v))}
          />
          <FieldTextarea
            label="What is in your pipeline?"
            value={str(state.core.pipeline)}
            onChange={(v) => setState((s) => patchCore(s, "pipeline", v))}
          />
        </section>
        <section className="panel">
          <label className="checkline">
            <input
              type="checkbox"
              checked={state.core.authority === true}
              onChange={(e) => setState((s) => patchCore(s, "authority", e.target.checked))}
            />
            <span>I am authorised to provide this information on behalf of the institution.</span>
          </label>
          <label className="checkline">
            <input
              type="checkbox"
              checked={state.core.accuracy === true}
              onChange={(e) => setState((s) => patchCore(s, "accuracy", e.target.checked))}
            />
            <span>
              I confirm the current capabilities and acceptance criteria are accurate and will notify SOPHIMA of
              material changes.
            </span>
          </label>
        </section>
      </>
    );
  }

  if (step === 8) {
    return (
      <section className="panel">
        <div className="notice">
          SOPHIMA verifies authorisations, agreement status and current product criteria before publication.
        </div>
        <dl className="summary">
          <dt>Institution</dt>
          <dd>{str(state.core.legalName) || "Not provided"}</dd>
          <dt>Jurisdiction</dt>
          <dd>{str(state.core.country) || "Not provided"}</dd>
          <dt>Referral agreement</dt>
          <dd>{str(state.core.agreement) || "Not provided"}</dd>
          <dt>Products</dt>
          <dd>{state.offers.map((x) => str(x.data.name) || FAMILIES[x.family]).join(", ") || "None selected"}</dd>
          <dt>Contact</dt>
          <dd>
            {[state.core.contactName, state.core.contactEmail, state.core.contactRole].filter(Boolean).join(" · ") ||
              "Not provided"}
          </dd>
        </dl>
      </section>
    );
  }

  return null;
}
