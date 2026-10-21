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
  AGREEMENT_STATUS_OPTIONS,
  ENTITY_TYPES,
  FAMILIES,
  FAMILY_ORDER,
  INDUSTRIES,
  INSTITUTION_TYPES,
  PAYMENT_ROUTES,
  REFERRAL_ATTRIBUTION,
  REFERRAL_METHODS,
} from "@/lib/provider-apply/config";
import { providerJurisdictionOptions } from "@/lib/provider-apply/countries";
import { axesForFamily } from "@/lib/provider-apply/geo";
import { activeOffers, currentOffer, isOfferActive, toggleProductFamily } from "@/lib/provider-apply/state";
import type { ProviderDraftState, ProviderOffer } from "@/lib/provider-apply/types";
import { agreementGateMessage, isAgreementVerified } from "@/lib/provider-apply/validation";
import Link from "next/link";

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
  return FAMILY_ORDER.flatMap((f) => activeOffers(state).filter((o) => o.family === f));
}

const JURISDICTION_HINT =
  "If your jurisdiction is not listed, FinSyndeo cannot currently accept a provider from that jurisdiction.";
const INCORPORATION_HINT =
  "If your jurisdiction is not listed, FinSyndeo cannot currently accept a provider from that jurisdiction.";

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
            options={[...AGREEMENT_STATUS_OPTIONS]}
            required
            onChange={(v) => setState((s) => patchCore(s, "agreement", v))}
          />
          <FieldInput
            label="Agreement reference or date (optional)"
            value={str(state.core.agreementRef)}
            onChange={(v) => setState((s) => patchCore(s, "agreementRef", v))}
          />
          <div className={`notice ${isAgreementVerified(state) ? "" : "notice-error"}`} role="status">
            <strong>Verification status: </strong>
            {isAgreementVerified(state) ? "Verified by SOPHIMA" : "Not verified"}
            <p className="hint" style={{ marginBottom: 0 }}>
              {agreementGateMessage(state)}
            </p>
          </div>
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
                  label="Licence / registration type"
                  value={str(lic.data.licenceType)}
                  required
                  placeholder="e.g. banking licence, EMI authorisation, MSB registration"
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      licenses: s.licenses.map((l) =>
                        l.id === lic.id ? { ...l, data: { ...l.data, licenceType: v } } : l
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
              <p className="hint">
                Proposed licence holder: <strong>{str(state.core.legalName) || "institution legal name"}</strong>. If
                another entity holds the authorisation, SOPHIMA must resolve that relationship before approval.
              </p>
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
                label="Permitted activities / authorisation scope (optional)"
                value={str(lic.data.scope)}
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
                  checked={state.offers.some((x) => x.family === id && isOfferActive(x))}
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
    const sharedIndustries =
      (state.core.sharedIndustries as Record<number, string> | undefined) ??
      (activeOffers(state)[0]?.data.industries as Record<number, string> | undefined) ??
      {};
    const sharedEntities =
      (state.core.sharedEntities as Record<number, string> | undefined) ??
      (activeOffers(state).find((x) => x.family !== "private")?.data.entities as
        | Record<number, string>
        | undefined) ??
      {};
    const sharedGeo =
      (state.core.sharedGeo as ProviderOffer["geo"]) ??
      activeOffers(state)[0]?.geo ??
      {};
    const sharedAxis =
      str(state.core.sharedGeoAxis) ||
      o?.axis ||
      axesForFamily(activeOffers(state)[0]?.family ?? "bank")[0]?.[0] ||
      "incorporation";
    const familyNames = orderedOffers(state)
      .map((x) => FAMILIES[x.family])
      .join(", ");

    function setSharedIndustries(next: Record<number, string>) {
      setState((s) => {
        let nextState = patchCore(s, "sharedIndustries", next);
        for (const offerRow of activeOffers(nextState)) {
          nextState = patchOffer(nextState, offerRow.id, { industries: next });
        }
        return nextState;
      });
    }

    function setSharedEntities(next: Record<number, string>) {
      setState((s) => {
        let nextState = patchCore(s, "sharedEntities", next);
        for (const offerRow of activeOffers(nextState).filter((x) => x.family !== "private")) {
          nextState = patchOffer(nextState, offerRow.id, { entities: next });
        }
        return nextState;
      });
    }

    return (
      <>
        <section className="panel">
          <h2>Upload your country acceptance policy</h2>
          <p className="hint">
            One shared country and industry policy applies to {familyNames || "your selected services"}. Upload PDF,
            Word, Excel or CSV files, or enter rules manually. Documents remain confidential to SOPHIMA.
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
                      if (extracted.industryHints) {
                        const industries = {
                          ...((s.core.sharedIndustries as Record<number, string>) ?? {}),
                        };
                        INDUSTRIES.forEach((label, i) => {
                          if (extracted.industryHints[label]) industries[i] = extracted.industryHints[label];
                        });
                        next = patchCore(next, "sharedIndustries", industries);
                        for (const offerRow of activeOffers(next)) {
                          next = patchOffer(next, offerRow.id, { industries });
                        }
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
                country rules proposed. Review below before confirming. Unreadable or conflicting rules stay
                unconfirmed until you confirm.
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
          <label className="checkline confirm-line" style={{ marginTop: 20, display: "flex" }}>
            <input
              type="checkbox"
              checked={state.core.acceptancePolicyConfirmed === true}
              onChange={(e) => setState((s) => patchCore(s, "acceptancePolicyConfirmed", e.target.checked))}
            />
            <span>
              I confirm this shared policy&apos;s completeness and scope for publication review. Omitted countries are
              not assumed accepted unless I confirm that interpretation.
            </span>
          </label>
        </section>

        <section className="panel">
          <h2>Country acceptance policy</h2>
          <p className="hint">
            One editor for all selected services. Provider choices cannot override platform exclusions. High-risk is
            not automatically Accepted or Prohibited.
          </p>
          <GeoAxisEditor
            family={activeOffers(state)[0]?.family ?? "bank"}
            offerId="shared"
            geo={sharedGeo ?? {}}
            axis={sharedAxis}
            onAxis={(nextAxis) => setState((s) => patchCore(s, "sharedGeoAxis", nextAxis))}
            onUpdate={(geo) =>
              setState((s) => {
                let next = patchCore(s, "sharedGeo", geo);
                for (const offerRow of activeOffers(next)) {
                  next = patchOfferGeo(next, offerRow.id, geo);
                }
                return next;
              })
            }
          />
        </section>

        <StatusMatrix
          title="Industry and activity acceptance"
          options={INDUSTRIES}
          values={sharedIndustries}
          onChange={(i, status) => setSharedIndustries({ ...sharedIndustries, [i]: status })}
        />
        <p className="hint">
          This confirmed common policy applies to {familyNames || "selected services"}. Unanswered activities are not
          accepted.
        </p>

        <StatusMatrix
          title="Legal entities accepted"
          options={ENTITY_TYPES}
          values={sharedEntities}
          onChange={(i, status) => setSharedEntities({ ...sharedEntities, [i]: status })}
        />

        <section className="panel">
          <FieldTextarea
            label="Specific conditions or exceptions (optional)"
            placeholder="e.g. residence outside disputed territories, licence-restricted activities, service-specific exceptions awaiting reconciliation."
            value={str(state.core.additionalAcceptance)}
            onChange={(v) => setState((s) => patchCore(s, "additionalAcceptance", v))}
          />
        </section>
      </>
    );
  }

  if (step === 5) {
    const offers = orderedOffers(state);
    if (!offers.length) {
      return (
        <section className="panel">
          <p>
            Select your services in{" "}
            <button type="button" className="btn mini" onClick={() => onGoToStep?.(2)}>
              Products
            </button>{" "}
            to complete this section.
          </p>
        </section>
      );
    }

    const paymentFamilies = offers.filter((x) => ["bank", "private", "correspondent"].includes(x.family));
    const routes = (state.core.paymentRoutes as Record<string, { incoming?: string; outgoing?: string }>) ?? {};
    const sharedMethods = arr(state.core.sharedOnboardingMethods);

    return (
      <>
        <section className="panel">
          <h2>Payments, limits &amp; onboarding</h2>
          <p className="hint">
            Common onboarding and applicable payment settings are entered once for{" "}
            {offers.map((x) => FAMILIES[x.family]).join(", ")}. Financing-only profiles do not require payment rails.
            Blank limits mean unknown — not unlimited or zero.
          </p>
          <CheckGroup
            legend="Available onboarding methods (common)"
            options={[
              "Remote — online identity verification",
              "Remote — recorded video identification",
              "Remote — live video interview",
              "In-person onboarding",
              "Other — please specify",
            ]}
            values={sharedMethods}
            onToggle={(value, checked) => {
              const next = checked
                ? [...new Set([...sharedMethods, value])]
                : sharedMethods.filter((x) => x !== value);
              setState((s) => {
                let nextState = patchCore(s, "sharedOnboardingMethods", next);
                for (const offerRow of activeOffers(nextState)) {
                  nextState = patchOffer(nextState, offerRow.id, { onboardingMethods: next });
                }
                return nextState;
              });
            }}
          />
          {sharedMethods.includes("Other — please specify") && (
            <FieldInput
              label="Other onboarding method"
              value={str(state.core.sharedOnboardingOther)}
              onChange={(v) => setState((s) => patchCore(s, "sharedOnboardingOther", v))}
            />
          )}
        </section>

        {paymentFamilies.length > 0 && (
          <section className="panel">
            <h2>Shared payment capabilities</h2>
            <p className="hint">
              Currency support alone does not imply every route. Selecting EUR or BaaS does not tick routes
              automatically. Record incoming and outgoing separately.
            </p>
            <div className="payment-route-matrix">
              {PAYMENT_ROUTES.map((route) => {
                const row = routes[route.id] ?? {};
                return (
                  <div key={route.id} className="status-row" style={{ alignItems: "flex-start" }}>
                    <span>{route.label}</span>
                    <div className="grid" style={{ flex: 1, minWidth: 200 }}>
                      <FieldSelect
                        label="Incoming"
                        value={str(row.incoming)}
                        options={["Supported", "Not supported", "Not confirmed"]}
                        onChange={(v) =>
                          setState((s) =>
                            patchCore(s, "paymentRoutes", {
                              ...((s.core.paymentRoutes as object) ?? {}),
                              [route.id]: { ...row, incoming: v },
                            })
                          )
                        }
                      />
                      <FieldSelect
                        label="Outgoing"
                        value={str(row.outgoing)}
                        options={["Supported", "Not supported", "Not confirmed"]}
                        onChange={(v) =>
                          setState((s) =>
                            patchCore(s, "paymentRoutes", {
                              ...((s.core.paymentRoutes as object) ?? {}),
                              [route.id]: { ...row, outgoing: v },
                            })
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <CheckGroup
              legend="Account offerings these payment capabilities apply to"
              options={paymentFamilies.map((x) => FAMILIES[x.family])}
              values={arr(state.core.paymentRouteApplicability)}
              onToggle={(value, checked) => {
                const current = arr(state.core.paymentRouteApplicability);
                const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
                setState((s) => patchCore(s, "paymentRouteApplicability", next));
              }}
            />
            <h3>Common monthly limits (optional)</h3>
            <div className="grid">
              <FieldInput
                label="Maximum incoming amount per month"
                type="number"
                value={str(state.core.sharedMaxIncoming)}
                onChange={(v) => setState((s) => patchCore(s, "sharedMaxIncoming", v))}
              />
              <FieldInput
                label="Maximum outgoing amount per month"
                type="number"
                value={str(state.core.sharedMaxOutgoing)}
                onChange={(v) => setState((s) => patchCore(s, "sharedMaxOutgoing", v))}
              />
            </div>
            {(str(state.core.sharedMaxIncoming) || str(state.core.sharedMaxOutgoing)) && (
              <FieldSelect
                label="Currency for the monthly amount limits"
                value={str(state.core.sharedLimitCurrency)}
                options={["EUR", "GBP", "USD"]}
                required
                onChange={(v) => setState((s) => patchCore(s, "sharedLimitCurrency", v))}
              />
            )}
          </section>
        )}

        {offers
          .filter((x) => x.family === "merchant" || x.family === "finance")
          .map((offerRow) => (
            <ProductTermsFields
              key={offerRow.id}
              offer={offerRow}
              setState={setState}
              patchOffer={patchOffer}
              familySpecificOnly
            />
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
              <p className="hint">
                Upload the form or provide the authorised form link. Previewing does not send applicant information.
              </p>
              <label className="field">
                <span>Upload the form</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setState((s) => patchCore(s, "preApprovalFileName", f.name));
                  }}
                />
              </label>
              {str(state.core.preApprovalFileName) && (
                <p className="hint">Uploaded: {str(state.core.preApprovalFileName)}</p>
              )}
              <FieldInput
                label="Provide the authorised form link"
                type="url"
                value={str(state.core.preApprovalFormLink)}
                onChange={(v) => setState((s) => patchCore(s, "preApprovalFormLink", v))}
              />
              <FieldSelect
                label="Who completes the form?"
                value={str(state.core.preApprovalCompletedBy)}
                options={["SOPHIMA", "Applicant", "Either"]}
                onChange={(v) => setState((s) => patchCore(s, "preApprovalCompletedBy", v))}
              />
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
                Preview configured route (sample — no applicant data)
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
        body:
          activeOffers(state)
            .map((x) => FAMILIES[x.family])
            .join(", ") || "Required — please complete",
      },
      {
        title: "Shared country and industry policy",
        step: 3,
        body: state.core.acceptancePolicyConfirmed
          ? "Shared policy confirmed"
          : state.documents?.length
            ? "Policy uploaded — confirmation pending"
            : "Required — please complete",
      },
      {
        title: "Payments, limits & onboarding",
        step: 5,
        body: arr(state.core.sharedOnboardingMethods).length
          ? "Common onboarding recorded"
          : activeOffers(state).length
            ? "Required — please complete"
            : "Select services in Products first",
      },
      {
        title: "Contacts, referral methods and benefits",
        step: 7,
        body: str(state.core.contactEmail) || "Required — please complete",
      },
      {
        title: "Referral agreement",
        step: 0,
        body: isAgreementVerified(state)
          ? "Verified by SOPHIMA"
          : str(state.core.agreement)
            ? `Declared: ${str(state.core.agreement)} — not verified`
            : "Required — please complete",
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
