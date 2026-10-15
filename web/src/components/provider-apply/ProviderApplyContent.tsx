"use client";

import {
  CheckGroup,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  GeoAxisEditor,
  StatusMatrix,
} from "@/components/provider-apply/form-controls";
import { ProductOfferFields } from "@/components/provider-apply/product-offer-fields";
import { ProductTermsFields } from "@/components/provider-apply/product-terms-fields";
import {
  ENTITY_TYPES,
  FAMILIES,
  FAMILY_ORDER,
  INDUSTRIES,
  INSTITUTION_TYPES,
  REFERRAL_ATTRIBUTION,
  REFERRAL_METHODS,
} from "@/lib/provider-apply/config";
import { providerJurisdictionOptions } from "@/lib/provider-apply/countries";
import { axesForFamily } from "@/lib/provider-apply/geo";
import { currentOffer, toggleProductFamily } from "@/lib/provider-apply/state";
import type { ProviderDraftState, ProviderOffer } from "@/lib/provider-apply/types";

type Props = {
  state: ProviderDraftState;
  setState: React.Dispatch<React.SetStateAction<ProviderDraftState>>;
  onGoToStep?: (step: number) => void;
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

function orderedOffers(state: ProviderDraftState) {
  return FAMILY_ORDER.flatMap((f) => state.offers.filter((o) => o.family === f));
}

const JURISDICTION_HINT =
  "If your authorisation jurisdiction is not listed, we currently do not accept authorisations issued in that jurisdiction.";
const INCORPORATION_HINT =
  "If your country is not listed, we currently do not accept providers incorporated in that jurisdiction.";

export function ProviderApplyContent({ state, setState, onGoToStep }: Props) {
  const step = state.step;
  const offer = currentOffer(state);
  const o = offer;
  const jurisdictionOptions = providerJurisdictionOptions();

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
            <div>
              <FieldSelect
                label="Country / jurisdiction of incorporation"
                value={str(state.core.country)}
                options={jurisdictionOptions}
                required
                onChange={(v) => setState((s) => patchCore(s, "country", v))}
              />
              <p className="field-hint-block">{INCORPORATION_HINT}</p>
            </div>
            <FieldInput
              label="Company registration number"
              value={str(state.core.registration)}
              required
              onChange={(v) => setState((s) => patchCore(s, "registration", v))}
            />
            <FieldSelect
              label="Primary institution type"
              value={str(state.core.type)}
              options={INSTITUTION_TYPES}
              required
              onChange={(v) => setState((s) => patchCore(s, "type", v))}
            />
            {state.core.type === "Other — please specify" && (
              <FieldInput
                label="Please specify institution type"
                value={str(state.core.typeOther)}
                required
                onChange={(v) => setState((s) => patchCore(s, "typeOther", v))}
              />
            )}
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
        {state.licenses.map((lic) => {
          const status = str(lic.data.status);
          const showRegister = status && !["Application pending", "No authorisation required — explain"].includes(status);
          return (
            <div key={lic.id} className="summary-card">
              <div className="grid">
                <FieldSelect
                  label="Regulatory status"
                  value={status}
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
                  required={status !== "No authorisation required — explain"}
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      licenses: s.licenses.map((l) =>
                        l.id === lic.id ? { ...l, data: { ...l.data, authority: v } } : l
                      ),
                    }))
                  }
                />
                <div>
                  <FieldSelect
                    label="Authorisation jurisdiction"
                    value={str(lic.data.country)}
                    options={jurisdictionOptions}
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
                  <p className="field-hint-block">{JURISDICTION_HINT}</p>
                </div>
              </div>
              <FieldInput
                label="Licence / registration / notification reference"
                value={str(lic.data.number)}
                required={!!showRegister}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    licenses: s.licenses.map((l) =>
                      l.id === lic.id ? { ...l, data: { ...l.data, number: v } } : l
                    ),
                  }))
                }
              />
              {showRegister && (
                <FieldInput
                  label="Link to your regulatory register entry (optional)"
                  value={str(lic.data.register)}
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      licenses: s.licenses.map((l) =>
                        l.id === lic.id ? { ...l, data: { ...l.data, register: v } } : l
                      ),
                    }))
                  }
                />
              )}
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
          );
        })}
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
          <div className="product-family-grid">
            {FAMILY_ORDER.map((id) => (
              <label key={id} className="service-card">
                <input
                  type="checkbox"
                  checked={state.offers.some((x) => x.family === id)}
                  onChange={(e) => setState((s) => toggleProductFamily(s, id, e.target.checked))}
                />
                <span>
                  <b>{FAMILIES[id]}</b>
                </span>
              </label>
            ))}
          </div>
        </section>
        {orderedOffers(state).map((offerRow) => (
          <ProductOfferFields key={offerRow.id} offer={offerRow} setState={setState} patchOffer={patchOffer} />
        ))}
      </>
    );
  }

  if (step === 3) {
    const axis = o?.axis ?? axesForFamily(state.offers[0]?.family ?? "bank")[0]?.[0] ?? "incorporation";

    return (
      <>
        <section className="panel">
          <h2>Upload your country acceptance policy</h2>
          <p className="hint">
            Upload PDF, Word, Excel or CSV files describing accepted or prohibited countries and customer acceptance
            rules. Documents remain confidential to SOPHIMA and are not shared with applicants.
          </p>
          <label className="field">
            <span>Policy documents</span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={async (e) => {
                const picked = Array.from(e.target.files ?? []);
                const meta = picked.map((f) => ({
                  name: f.name,
                  size: f.size,
                  uploadedAt: new Date().toISOString(),
                }));
                setState((s) => ({ ...s, documents: [...(s.documents ?? []), ...meta] }));
                const textFile = picked.find((f) => /\.(csv|txt)$/i.test(f.name));
                if (textFile) {
                  const text = await textFile.text();
                  const res = await fetch("/api/providers/policy/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                  });
                  if (res.ok) {
                    const extracted = await res.json();
                    setState((s) => {
                      let next = patchCore(s, "policyExtraction", extracted);
                      if (extracted.industryHints && s.offers[0]) {
                        const industries = { ...(s.offers[0].data.industries as Record<number, string>) };
                        INDUSTRIES.forEach((label, i) => {
                          if (extracted.industryHints[label]) industries[i] = extracted.industryHints[label];
                        });
                        next = patchOffer(next, s.offers[0].id, { industries });
                      }
                      return next;
                    });
                  }
                }
              }}
            />
          </label>
          {state.documents?.length ? (
            <ul>
              {state.documents.map((d, i) => (
                <li key={i}>{str(d.name)}</li>
              ))}
            </ul>
          ) : null}
          {state.core.policyExtraction != null && (
            <div className="notice">
              <strong>Extracted policy summary</strong>
              <p className="hint">
                {Number(
                  (state.core.policyExtraction as { countryRules?: unknown[] })?.countryRules?.length ?? 0
                )}{" "}
                country rules proposed. Review below before confirming.
              </p>
            </div>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => setState((s) => patchCore(s, "acceptancePolicyMode", "manual"))}
          >
            Enter policy manually
          </button>
          <label className="checkline" style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              checked={state.core.acceptancePolicyConfirmed === true}
              onChange={(e) => setState((s) => patchCore(s, "acceptancePolicyConfirmed", e.target.checked))}
            />
            <span>I have reviewed and confirm the extracted or entered acceptance rules for publication review.</span>
          </label>
        </section>
        {state.offers.map((offerRow) => (
          <div key={offerRow.id}>
            <h2>{FAMILIES[offerRow.family]}</h2>
            <GeoAxisEditor
              family={offerRow.family}
              offerId={offerRow.id}
              geo={offerRow.geo ?? {}}
              axis={offerRow.axis ?? axis}
              onAxis={(nextAxis) =>
                setState((s) => ({
                  ...s,
                  offers: s.offers.map((x) => (x.id === offerRow.id ? { ...x, axis: nextAxis } : x)),
                }))
              }
              onUpdate={(geo) => setState((s) => patchOfferGeo(s, offerRow.id, geo))}
            />
            <StatusMatrix
              title={offerRow.family === "private" ? "Business / wealth-generating sectors" : "Industry acceptance"}
              options={INDUSTRIES}
              values={(offerRow.data.industries as Record<number, string>) ?? {}}
              onChange={(i, status) =>
                setState((s) => {
                  const ind = (offerRow.data.industries as Record<number, string>) ?? {};
                  return patchOffer(s, offerRow.id, { industries: { ...ind, [i]: status } });
                })
              }
            />
            {offerRow.family !== "private" && (
              <StatusMatrix
                title="Legal entities accepted"
                options={ENTITY_TYPES}
                values={(offerRow.data.entities as Record<number, string>) ?? {}}
                onChange={(i, status) =>
                  setState((s) => {
                    const ent = (offerRow.data.entities as Record<number, string>) ?? {};
                    return patchOffer(s, offerRow.id, { entities: { ...ent, [i]: status } });
                  })
                }
              />
            )}
          </div>
        ))}
        <section className="panel">
          <FieldTextarea
            label="Additional acceptance conditions"
            placeholder="Describe any additional restrictions, exceptions or requirements not covered elsewhere."
            value={str(state.core.additionalAcceptance)}
            onChange={(v) => setState((s) => patchCore(s, "additionalAcceptance", v))}
          />
        </section>
      </>
    );
  }

  if (step === 5) {
    return (
      <>
        {orderedOffers(state).map((offerRow) => (
          <ProductTermsFields key={offerRow.id} offer={offerRow} setState={setState} patchOffer={patchOffer} />
        ))}
      </>
    );
  }

  if (step === 7) {
    const methods = arr(state.core.referralMethods);
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
          <CheckGroup
            legend="Accepted referral methods"
            options={REFERRAL_METHODS}
            values={methods}
            onToggle={(value, checked) => {
              const current = arr(state.core.referralMethods);
              const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
              setState((s) => patchCore(s, "referralMethods", next));
            }}
          />
          <FieldInput
            label="Email address for SOPHIMA introductions and referral notifications"
            type="email"
            value={str(state.core.referralEmail)}
            required
            onChange={(v) => setState((s) => patchCore(s, "referralEmail", v))}
          />
          <button
            type="button"
            className="btn mini"
            onClick={() => setState((s) => patchCore(s, "referralEmail", str(s.core.contactEmail)))}
          >
            Use contact email
          </button>
          {methods.includes("Referral link — applicant completes the application") && (
            <FieldInput
              label="Referral URL"
              value={str(state.core.referralUrl)}
              onChange={(v) => setState((s) => patchCore(s, "referralUrl", v))}
            />
          )}
          {methods.includes("Introducer portal — SOPHIMA submits on the applicant's behalf") && (
            <>
              <FieldInput
                label="Portal URL"
                value={str(state.core.portalUrl)}
                onChange={(v) => setState((s) => patchCore(s, "portalUrl", v))}
              />
              <p className="hint">This method requires SOPHIMA-assisted submission. Do not enter login credentials.</p>
            </>
          )}
          {methods.includes("Provider pre-approval form") && (
            <>
              <label className="field">
                <span>Provider pre-approval template (optional)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setState((s) => patchCore(s, "preApprovalFileName", f.name));
                  }}
                />
              </label>
              <FieldSelect
                label="Can SOPHIMA's standard client profile be accepted instead?"
                value={str(state.core.sophimaProfileAccepted)}
                options={["Yes", "No", "Case-by-case"]}
                onChange={(v) => setState((s) => patchCore(s, "sophimaProfileAccepted", v))}
              />
              <button
                type="button"
                className="btn"
                onClick={() => window.open("/api/providers/client-profile-preview?route=bank", "_blank")}
              >
                Preview SOPHIMA&apos;s client profile
              </button>
            </>
          )}
          <CheckGroup
            legend="How is SOPHIMA's referral attribution confirmed?"
            options={REFERRAL_ATTRIBUTION}
            values={arr(state.core.referralAttribution)}
            onToggle={(value, checked) => {
              const current = arr(state.core.referralAttribution);
              const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
              setState((s) => patchCore(s, "referralAttribution", next));
            }}
          />
        </section>
        <section className="panel">
          <h2>Benefits & confirmations</h2>
          <FieldTextarea
            label="Distinctive benefits / strengths"
            value={str(state.core.benefits)}
            onChange={(v) => setState((s) => patchCore(s, "benefits", v))}
          />
        </section>
        <section className="panel">
          <label className="confirm-line">
            <input
              type="checkbox"
              checked={state.core.authority === true}
              onChange={(e) => setState((s) => patchCore(s, "authority", e.target.checked))}
            />
            <span>I am authorised to provide this information on behalf of the institution.</span>
          </label>
          <label className="confirm-line">
            <input
              type="checkbox"
              checked={state.core.accuracy === true}
              onChange={(e) => setState((s) => patchCore(s, "accuracy", e.target.checked))}
            />
            <span>
              I confirm that the information is accurate and will update the institution&apos;s profile when material
              changes occur.
            </span>
          </label>
        </section>
      </>
    );
  }

  if (step === 8) {
    const cards = [
      { title: "Institution details", step: 0, body: str(state.core.legalName) || "Required — please complete" },
      { title: "Authorisations", step: 1, body: `${state.licenses.length} record(s)` },
      {
        title: "Products",
        step: 2,
        body: state.offers.map((x) => FAMILIES[x.family]).join(", ") || "Required — please complete",
      },
      { title: "Acceptance policies and conditions", step: 3, body: state.documents?.length ? "Policy uploaded" : "Not specified" },
      { title: "Product terms and onboarding", step: 5, body: `${state.offers.length} product section(s)` },
      {
        title: "Contacts, referral methods and benefits",
        step: 7,
        body: str(state.core.contactEmail) || "Required — please complete",
      },
      {
        title: "Uploaded documents",
        step: 3,
        body: state.documents?.length
          ? state.documents.map((d) => str(d.name)).join(", ")
          : "Not specified",
      },
    ];

    return (
      <section className="review-cards">
        {cards.map((card) => (
          <article key={card.title} className="review-card">
            <header>
              <h2 style={{ margin: 0, fontSize: 18 }}>{card.title}</h2>
              {onGoToStep && (
                <button type="button" className="btn mini" onClick={() => onGoToStep(card.step)}>
                  Edit
                </button>
              )}
            </header>
            <p style={{ margin: 0 }}>{card.body}</p>
          </article>
        ))}
        <div className="notice">
          Your profile will become available for matching only after SOPHIMA approval and verification of a current
          referral agreement.
        </div>
      </section>
    );
  }

  return null;
}
