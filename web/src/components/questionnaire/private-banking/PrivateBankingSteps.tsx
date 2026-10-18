"use client";

import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import { CountrySearchSelect } from "@/components/questionnaire/CountrySearchSelect";
import {
  PB_ASSET_BANDS,
  PB_CURRENCIES,
  PB_FUND_SOURCES,
  PB_LANGUAGES,
  PB_OCCUPATION,
  PB_SERVICES,
  PB_TRANSFER_PURPOSES,
  PB_WEALTH_SOURCES,
  currKey,
  currLevelKey,
  fundKey,
  purposeKey,
  svcKey,
  svcLevelKey,
  wealthKey,
} from "@/lib/questionnaire/private-banking-config";
import type { CountryPickers, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  step: number;
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onChange: (key: string, value: FieldValue) => void;
  onPickerChange: (id: string, list: string[]) => void;
};

function LevelToggle({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="level-toggle" role="group" aria-label={`Priority for ${name}`}>
      <label>
        <input type="radio" name={name} checked={value === "required"} onChange={() => onChange("required")} />
        Required
      </label>
      <label>
        <input type="radio" name={name} checked={value !== "required"} onChange={() => onChange("preferred")} />
        Preferred
      </label>
    </div>
  );
}

function ServiceCards({ values, onChange }: Pick<Props, "values" | "onChange">) {
  return (
    <>
      <p className="field-label">What would you like the bank to provide?</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        Required services determine eligibility; preferred services improve the match.
      </p>
      <div className="service-card-grid">
        {PB_SERVICES.map((s) => {
          const on = values[svcKey(s.id)] === true;
          return (
            <div key={s.id} className={`service-card ${on ? "service-card-on" : ""}`}>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => onChange(svcKey(s.id), e.target.checked)}
                />
                <span>{s.label}</span>
              </label>
              {on && (
                <LevelToggle
                  name={`level-${s.id}`}
                  value={String(values[svcLevelKey(s.id)] ?? "preferred")}
                  onChange={(v) => onChange(svcLevelKey(s.id), v)}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function PrivateBankingSteps({ step, values, pickers, onChange, onPickerChange }: Props) {
  if (step === 20) {
    const nationalities = pickers["pb-nationality"] ?? [];
    const tax = pickers["pb-tax"] ?? [];
    const residence = String(values["pb-residence"] ?? "");
    const singleNat = nationalities.length === 1 ? nationalities[0] : "";
    const liveShortcutCountry = String(values["pb-shortcut-live-country"] ?? "");
    const taxShortcutCountry = String(values["pb-shortcut-tax-country"] ?? "");
    const liveShortcutActive = liveShortcutCountry !== "" && residence === liveShortcutCountry;
    const taxShortcutActive = taxShortcutCountry !== "" && tax.includes(taxShortcutCountry);

    return (
      <>
        <p className="lead">Tell us about yourself.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="field">
            <span>Name</span>
            <input value={String(values["pb-name"] ?? "")} onChange={(e) => onChange("pb-name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Surname</span>
            <input value={String(values["pb-surname"] ?? "")} onChange={(e) => onChange("pb-surname", e.target.value)} required />
          </label>
        </div>
        <label className="field">
          <span>Contact email</span>
          <input
            type="email"
            value={String(values["pb-email"] ?? "")}
            onChange={(e) => onChange("pb-email", e.target.value)}
            required
          />
        </label>
        <CountryMultiSelect
          id="pb-nationality"
          label="Nationality / nationalities"
          required
          value={nationalities}
          onChange={(next) => {
            onPickerChange("pb-nationality", next);
            if (liveShortcutCountry && (next.length !== 1 || next[0] !== liveShortcutCountry)) {
              if (residence === liveShortcutCountry) onChange("pb-residence", "");
              onChange("pb-shortcut-live-country", "");
            }
          }}
        />
        {singleNat && (
          <label className="checkline">
            <input
              type="checkbox"
              checked={liveShortcutActive && singleNat === liveShortcutCountry}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange("pb-residence", singleNat);
                  onChange("pb-shortcut-live-country", singleNat);
                } else {
                  if (residence === liveShortcutCountry) onChange("pb-residence", "");
                  onChange("pb-shortcut-live-country", "");
                }
              }}
            />
            <span>I also live in {singleNat}.</span>
          </label>
        )}
        <CountrySearchSelect
          id="pb-residence"
          label="Country of residence"
          required
          value={residence}
          onChange={(v) => {
            onChange("pb-residence", v);
            if (liveShortcutCountry && v !== liveShortcutCountry) {
              onChange("pb-shortcut-live-country", "");
            }
            if (taxShortcutCountry && taxShortcutCountry !== v) {
              if (tax.includes(taxShortcutCountry)) {
                onPickerChange(
                  "pb-tax",
                  tax.filter((c) => c !== taxShortcutCountry)
                );
              }
              onChange("pb-shortcut-tax-country", "");
            }
          }}
        />
        {residence && (
          <label className="checkline">
            <input
              type="checkbox"
              checked={taxShortcutActive && taxShortcutCountry === residence}
              onChange={(e) => {
                if (e.target.checked) {
                  onPickerChange("pb-tax", [...new Set([...tax, residence])].sort());
                  onChange("pb-shortcut-tax-country", residence);
                } else {
                  onPickerChange(
                    "pb-tax",
                    tax.filter((c) => c !== taxShortcutCountry)
                  );
                  onChange("pb-shortcut-tax-country", "");
                }
              }}
            />
            <span>I am also tax resident in {residence}.</span>
          </label>
        )}
        <CountryMultiSelect
          id="pb-tax"
          label="Country / countries of tax residence"
          required
          value={tax}
          onChange={(next) => {
            onPickerChange("pb-tax", next);
            if (taxShortcutCountry && !next.includes(taxShortcutCountry)) {
              onChange("pb-shortcut-tax-country", "");
            }
          }}
        />
        <p className="text-sm text-[var(--muted)]">Select all countries where you are tax resident.</p>
      </>
    );
  }

  if (step === 21) {
    const showOtherBank = values["pb-current-bank"] === "Yes";
    const lang = String(values["pb-language"] ?? "");
    return (
      <>
        <ServiceCards values={values} onChange={onChange} />
        {values[svcKey("other")] === true && (
          <label className="field">
            <span>Please specify other services</span>
            <textarea value={String(values["pb-needs-text"] ?? "")} onChange={(e) => onChange("pb-needs-text", e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Anything else you would like us to consider? <small>(optional)</small></span>
          <textarea value={String(values["pb-needs-extra"] ?? "")} onChange={(e) => onChange("pb-needs-extra", e.target.value)} />
        </label>
        <label className="field">
          <span>Your approximate liquid assets — EUR equivalent</span>
          <select value={String(values["pb-assets"] ?? "")} onChange={(e) => onChange("pb-assets", e.target.value)} required>
            <option value="">Select…</option>
            {PB_ASSET_BANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-[var(--muted)]">
          Cash and readily realisable investments; exclude property and other illiquid assets.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="field">
            <span>Amount you expect to place with the bank — EUR equivalent</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={String(values["pb-transfer"] ?? "")}
              onChange={(e) => onChange("pb-transfer", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Currency</span>
            <select value={String(values["pb-placement-currency"] ?? "EUR")} onChange={(e) => onChange("pb-placement-currency", e.target.value)}>
              {["EUR", "GBP", "USD", "CHF"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="field-label mt-6">Which account currencies do you need?</p>
        <div className="checks-grid">
          {PB_CURRENCIES.map((code) => {
            const on = values[currKey(code)] === true;
            return (
              <div key={code} className="check-block">
                <label className="checkline">
                  <input type="checkbox" checked={on} onChange={(e) => onChange(currKey(code), e.target.checked)} />
                  <span>{code}</span>
                </label>
                {on && (
                  <LevelToggle
                    name={`curr-${code}`}
                    value={String(values[currLevelKey(code)] ?? "preferred")}
                    onChange={(v) => onChange(currLevelKey(code), v)}
                  />
                )}
              </div>
            );
          })}
        </div>
        {values[currKey("Other")] === true && (
          <label className="field">
            <span>Other currencies</span>
            <input value={String(values["pb-currencies-text"] ?? "")} onChange={(e) => onChange("pb-currencies-text", e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Preferred relationship-manager language <small>(optional)</small></span>
          <input
            list="pb-language-list"
            value={lang}
            onChange={(e) => onChange("pb-language", e.target.value)}
            placeholder="Search languages…"
          />
          <datalist id="pb-language-list">
            {PB_LANGUAGES.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </label>
        {lang && (
          <LevelToggle
            name="pb-language-level"
            value={String(values["pb-language-level"] ?? "preferred")}
            onChange={(v) => onChange("pb-language-level", v)}
          />
        )}
        {lang === "Other" && (
          <label className="field">
            <span>Other language</span>
            <input value={String(values["pb-language-other"] ?? "")} onChange={(e) => onChange("pb-language-other", e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Do you have an existing private-banking relationship? <small>(optional)</small></span>
          <select value={String(values["pb-current-bank"] ?? "")} onChange={(e) => onChange("pb-current-bank", e.target.value)}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Prefer not to answer">Prefer not to answer</option>
          </select>
        </label>
        {showOtherBank && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="field">
              <span>Bank name <small>(optional)</small></span>
              <input value={String(values["pb-current-bank-name"] ?? "")} onChange={(e) => onChange("pb-current-bank-name", e.target.value)} />
            </label>
            <label className="field">
              <span>Country <small>(optional)</small></span>
              <input value={String(values["pb-current-bank-country"] ?? "")} onChange={(e) => onChange("pb-current-bank-country", e.target.value)} />
            </label>
          </div>
        )}
      </>
    );
  }

  if (step === 22) {
    return (
      <>
        <label className="field">
          <span>Current professional status</span>
          <select value={String(values["pb-occupation"] ?? "")} onChange={(e) => onChange("pb-occupation", e.target.value)}>
            <option value="">Select…</option>
            {PB_OCCUPATION.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        {values["pb-occupation"] === "Other" && (
          <label className="field">
            <span>Please specify</span>
            <input value={String(values["pb-occupation-other"] ?? "")} onChange={(e) => onChange("pb-occupation-other", e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>LinkedIn profile URL <small>(optional)</small></span>
          <input type="url" value={String(values["pb-linkedin"] ?? "")} onChange={(e) => onChange("pb-linkedin", e.target.value)} />
        </label>
        <label className="field">
          <span>Occupation / business activity <small>(optional)</small></span>
          <textarea value={String(values["pb-career"] ?? "")} onChange={(e) => onChange("pb-career", e.target.value)} />
        </label>
        <p className="field-label mt-4">How was your wealth accumulated?</p>
        <div className="checks-grid">
          {PB_WEALTH_SOURCES.map((s) => (
            <label key={s.id} className="checkline service-card">
              <input type="checkbox" checked={values[wealthKey(s.id)] === true} onChange={(e) => onChange(wealthKey(s.id), e.target.checked)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
        {values[wealthKey("other")] === true && (
          <label className="field">
            <span>Please specify</span>
            <textarea value={String(values["pb-wealth-other-text"] ?? "")} onChange={(e) => onChange("pb-wealth-other-text", e.target.value)} />
          </label>
        )}
        <p className="field-label mt-6">What is the source of the money you intend to place with the bank?</p>
        <p className="text-sm text-[var(--muted)]">This refers to the proposed deposit, rather than your total wealth.</p>
        <div className="checks-grid">
          {PB_FUND_SOURCES.map((s) => (
            <label key={s.id} className="checkline service-card">
              <input type="checkbox" checked={values[fundKey(s.id)] === true} onChange={(e) => onChange(fundKey(s.id), e.target.checked)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
        {values[fundKey("other")] === true && (
          <label className="field">
            <span>Please specify</span>
            <textarea value={String(values["pb-fund-other-text"] ?? "")} onChange={(e) => onChange("pb-fund-other-text", e.target.value)} />
          </label>
        )}
        {values[fundKey("existing_savings")] === true && (
          <>
            <p className="field-label">Original source of existing savings / investments</p>
            <div className="checks-grid">
              {PB_WEALTH_SOURCES.map((s) => (
                <label key={s.id} className="checkline">
                  <input
                    type="checkbox"
                    checked={values[`pb-fund-origin:${s.id}`] === true}
                    onChange={(e) => onChange(`pb-fund-origin:${s.id}`, e.target.checked)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  if (step === 23) {
    const regular = String(values["pb-regular-transfers"] ?? "");
    const own = String(values["pb-own-funds"] ?? "");
    const dir = String(values["pb-transfer-direction"] ?? "");
    return (
      <>
        <h2 className="text-lg font-semibold mt-0">Initial funding</h2>
        <label className="field">
          <span>Sending bank / institution <small>(optional)</small></span>
          <input value={String(values["pb-origin-bank"] ?? "")} onChange={(e) => onChange("pb-origin-bank", e.target.value)} />
        </label>
        <CountryMultiSelect
          id="pb-origin-country"
          label="Country / countries from which the initial transfer will be sent"
          required
          value={pickers["pb-origin-country"] ?? []}
          onChange={(next) => onPickerChange("pb-origin-country", next)}
        />
        <label className="field">
          <span>Will the initial funds come from an account in your own name?</span>
          <select value={own} onChange={(e) => onChange("pb-own-funds", e.target.value)}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="Joint account including my name">Joint account including my name</option>
            <option value="No">No</option>
          </select>
        </label>
        {own === "No" && (
          <>
            <label className="field">
              <span>Sender&apos;s name</span>
              <input value={String(values["pb-third-party-name"] ?? "")} onChange={(e) => onChange("pb-third-party-name", e.target.value)} />
            </label>
            <label className="field">
              <span>Relationship to you</span>
              <input value={String(values["pb-third-party-relationship"] ?? "")} onChange={(e) => onChange("pb-third-party-relationship", e.target.value)} />
            </label>
            <label className="field">
              <span>Brief reason for third-party funding</span>
              <textarea value={String(values["pb-third-party-reason"] ?? "")} onChange={(e) => onChange("pb-third-party-reason", e.target.value)} />
            </label>
          </>
        )}
        <h2 className="text-lg font-semibold">Ongoing account activity</h2>
        <label className="field">
          <span>Do you expect regular incoming or outgoing transfers?</span>
          <select value={regular} onChange={(e) => onChange("pb-regular-transfers", e.target.value)}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Not yet known">Not yet known</option>
          </select>
        </label>
        {regular === "Yes" && (
          <>
            <label className="field">
              <span>Direction</span>
              <select value={dir} onChange={(e) => onChange("pb-transfer-direction", e.target.value)}>
                <option value="">Select…</option>
                <option value="Incoming">Incoming</option>
                <option value="Outgoing">Outgoing</option>
                <option value="Both">Both</option>
              </select>
            </label>
            {(dir === "Incoming" || dir === "Both") && (
              <section className="panel">
                <h3>Incoming</h3>
                <CountryMultiSelect
                  id="pb-incoming"
                  label="Relevant countries"
                  required
                  value={pickers["pb-incoming"] ?? []}
                  onChange={(next) => onPickerChange("pb-incoming", next)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="field">
                    <span>Expected transactions per month</span>
                    <input type="number" min={0} step={1} value={String(values["pb-in-count"] ?? "")} onChange={(e) => onChange("pb-in-count", e.target.value)} />
                  </label>
                  <label className="field">
                    <span>Expected total amount per month</span>
                    <input type="number" min={0} step="0.01" value={String(values["pb-in-amount"] ?? "")} onChange={(e) => onChange("pb-in-amount", e.target.value)} />
                  </label>
                </div>
              </section>
            )}
            {(dir === "Outgoing" || dir === "Both") && (
              <section className="panel">
                <h3>Outgoing</h3>
                <CountryMultiSelect
                  id="pb-outgoing"
                  label="Relevant countries"
                  required
                  value={pickers["pb-outgoing"] ?? []}
                  onChange={(next) => onPickerChange("pb-outgoing", next)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="field">
                    <span>Expected transactions per month</span>
                    <input type="number" min={0} step={1} value={String(values["pb-out-count"] ?? "")} onChange={(e) => onChange("pb-out-count", e.target.value)} />
                  </label>
                  <label className="field">
                    <span>Expected total amount per month</span>
                    <input type="number" min={0} step="0.01" value={String(values["pb-out-amount"] ?? "")} onChange={(e) => onChange("pb-out-amount", e.target.value)} />
                  </label>
                </div>
              </section>
            )}
            <label className="field">
              <span>Currency for the monthly amount limits</span>
              <select value={String(values["pb-report-currency"] ?? "")} onChange={(e) => onChange("pb-report-currency", e.target.value)}>
                <option value="">Select…</option>
                {["EUR", "GBP", "USD", "CHF"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <p className="field-label">Purpose of regular transfers</p>
            <div className="checks-grid">
              {PB_TRANSFER_PURPOSES.map((p) => (
                <label key={p} className="checkline">
                  <input type="checkbox" checked={values[purposeKey(p)] === true} onChange={(e) => onChange(purposeKey(p), e.target.checked)} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
            {values[purposeKey("Other")] === true && (
              <label className="field">
                <span>Please specify</span>
                <input value={String(values["pb-purpose-other"] ?? "")} onChange={(e) => onChange("pb-purpose-other", e.target.value)} />
              </label>
            )}
            <label className="field">
              <span>Additional explanation <small>(optional)</small></span>
              <textarea value={String(values["pb-transfer-notes"] ?? "")} onChange={(e) => onChange("pb-transfer-notes", e.target.value)} />
            </label>
          </>
        )}
      </>
    );
  }

  return null;
}
