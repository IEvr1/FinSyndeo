"use client";

import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import { CountrySearchSelect } from "@/components/questionnaire/CountrySearchSelect";
import {
  PB_AMOUNT_BANDS,
  PB_ASSET_BANDS,
  PB_COUNT_BANDS,
  PB_CURRENCIES,
  PB_INCOMING_PURPOSES,
  PB_LANGUAGES,
  PB_OCCUPATION,
  PB_OUTGOING_PURPOSES,
  PB_SERVICES,
  PB_THIRD_PARTY_RELATIONSHIPS,
  PB_WEALTH_SOURCES,
  currKey,
  currLevelKey,
  inAmountKey,
  inCountKey,
  inPurposeKey,
  outAmountKey,
  outCountKey,
  outPurposeKey,
  railKey,
  railsForCurrency,
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
  fieldErrors?: Record<string, string>;
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
        Must-have
      </label>
      <label>
        <input type="radio" name={name} checked={value !== "required"} onChange={() => onChange("preferred")} />
        Good to have
      </label>
    </div>
  );
}

function FieldError({ id, errors }: { id: string; errors?: Record<string, string> }) {
  const msg = errors?.[id];
  if (!msg) return null;
  return (
    <p className="field-error" id={`${id}-error`} role="alert">
      {msg}
    </p>
  );
}

function ServiceCards({ values, onChange, fieldErrors }: Pick<Props, "values" | "onChange" | "fieldErrors">) {
  return (
    <>
      <p className="field-label">Which additional services would you like to use?</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        Select any services you need in addition to your private-banking account. Must-have services determine
        eligibility; good to have services improve the match. Extras are optional as a group.
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
      <FieldError id="pb-services" errors={fieldErrors} />
    </>
  );
}

export function PrivateBankingSteps({ step, values, pickers, onChange, onPickerChange, fieldErrors }: Props) {
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
          <label className="field" data-field="pb-name">
            <span>Name</span>
            <input value={String(values["pb-name"] ?? "")} onChange={(e) => onChange("pb-name", e.target.value)} required />
            <FieldError id="pb-name" errors={fieldErrors} />
          </label>
          <label className="field" data-field="pb-surname">
            <span>Surname</span>
            <input value={String(values["pb-surname"] ?? "")} onChange={(e) => onChange("pb-surname", e.target.value)} required />
            <FieldError id="pb-surname" errors={fieldErrors} />
          </label>
        </div>
        <label className="field" data-field="pb-email">
          <span>Contact email</span>
          <input
            type="email"
            value={String(values["pb-email"] ?? "")}
            onChange={(e) => onChange("pb-email", e.target.value)}
            required
          />
          <p className="text-sm text-[var(--muted)]">Contact is by email. Changing this does not change your sign-in email.</p>
          <FieldError id="pb-email" errors={fieldErrors} />
        </label>
        <div data-field="pb-nationality">
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
          <FieldError id="pb-nationality" errors={fieldErrors} />
        </div>
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
        <div data-field="pb-residence">
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
                onChange("pb-shortcut-tax-country", "");
              }
            }}
          />
          <FieldError id="pb-residence" errors={fieldErrors} />
        </div>
        {residence && (
          <>
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
              <span>Use {residence} as a tax residence</span>
            </label>
            <p className="text-sm text-[var(--muted)]">You can add other tax-residence countries.</p>
          </>
        )}
        <div data-field="pb-tax">
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
          <FieldError id="pb-tax" errors={fieldErrors} />
        </div>
        <p className="text-sm text-[var(--muted)]">Select all countries where you are tax resident.</p>
      </>
    );
  }

  if (step === 21) {
    const showOtherBank = values["pb-current-bank"] === "Yes";
    const lang = String(values["pb-language"] ?? "");
    const selectedCurrencies = PB_CURRENCIES.filter((c) => values[currKey(c)] === true);

    return (
      <>
        <ServiceCards values={values} onChange={onChange} fieldErrors={fieldErrors} />
        {values[svcKey("other")] === true && (
          <label className="field" data-field="pb-needs-text">
            <span>Please specify other services</span>
            <textarea value={String(values["pb-needs-text"] ?? "")} onChange={(e) => onChange("pb-needs-text", e.target.value)} />
            <FieldError id="pb-needs-text" errors={fieldErrors} />
          </label>
        )}
        <label className="field">
          <span>Anything else you would like us to consider?</span>
          <textarea value={String(values["pb-needs-extra"] ?? "")} onChange={(e) => onChange("pb-needs-extra", e.target.value)} />
        </label>
        <label className="field" data-field="pb-assets">
          <span>Your approximate liquid assets — EUR equivalent</span>
          <select value={String(values["pb-assets"] ?? "")} onChange={(e) => onChange("pb-assets", e.target.value)} required>
            <option value="">Select…</option>
            {PB_ASSET_BANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <FieldError id="pb-assets" errors={fieldErrors} />
        </label>
        <p className="text-sm text-[var(--muted)]">
          Cash and readily realisable investments; exclude property and other illiquid assets.
        </p>
        <label className="field" data-field="pb-transfer">
          <span>Amount you expect to place with the bank — EUR equivalent</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={String(values["pb-transfer"] ?? "")}
            onChange={(e) => onChange("pb-transfer", e.target.value)}
          />
          <FieldError id="pb-transfer" errors={fieldErrors} />
        </label>
        <p className="field-label mt-6">Which account currencies do you need?</p>
        <div className="checks-grid" data-field="pb-currencies">
          {PB_CURRENCIES.map((code) => {
            const on = values[currKey(code)] === true;
            return (
              <div key={code} className="check-block">
                <label className="checkline">
                  <input type="checkbox" checked={on} onChange={(e) => onChange(currKey(code), e.target.checked)} />
                  <span>{code}</span>
                </label>
                {on && (
                  <>
                    <LevelToggle
                      name={`curr-${code}`}
                      value={String(values[currLevelKey(code)] ?? "preferred")}
                      onChange={(v) => onChange(currLevelKey(code), v)}
                    />
                    <FieldError id={`pb-curr-level:${code}`} errors={fieldErrors} />
                    <p className="text-sm text-[var(--muted)] mt-2">Payment methods for {code} (optional)</p>
                    <div className="checks-grid">
                      {railsForCurrency(code).map((r) => (
                        <label key={r.id} className="checkline">
                          <input
                            type="checkbox"
                            checked={values[railKey(r.id)] === true}
                            onChange={(e) => onChange(railKey(r.id), e.target.checked)}
                          />
                          <span>{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <FieldError id="pb-currencies" errors={fieldErrors} />
        {selectedCurrencies.length === 0 && null}
        <label className="field">
          <span>Preferred relationship-manager language</span>
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
          <span>Do you have an existing private-banking relationship?</span>
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
              <span>Bank name</span>
              <input value={String(values["pb-current-bank-name"] ?? "")} onChange={(e) => onChange("pb-current-bank-name", e.target.value)} />
            </label>
            <label className="field">
              <span>Country</span>
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
        <label className="field" data-field="pb-occupation">
          <span>Current professional status</span>
          <select value={String(values["pb-occupation"] ?? "")} onChange={(e) => onChange("pb-occupation", e.target.value)}>
            <option value="">Select…</option>
            {PB_OCCUPATION.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <FieldError id="pb-occupation" errors={fieldErrors} />
        </label>
        {values["pb-occupation"] === "Other" && (
          <label className="field" data-field="pb-occupation-other">
            <span>Please specify</span>
            <input value={String(values["pb-occupation-other"] ?? "")} onChange={(e) => onChange("pb-occupation-other", e.target.value)} />
            <FieldError id="pb-occupation-other" errors={fieldErrors} />
          </label>
        )}
        <label className="field">
          <span>LinkedIn profile URL</span>
          <input type="url" value={String(values["pb-linkedin"] ?? "")} onChange={(e) => onChange("pb-linkedin", e.target.value)} />
        </label>
        <label className="field">
          <span>Occupation / business activity</span>
          <textarea value={String(values["pb-career"] ?? "")} onChange={(e) => onChange("pb-career", e.target.value)} />
        </label>
        <p className="field-label mt-4">How was your wealth accumulated?</p>
        <div className="checks-grid" data-field="pb-wealth">
          {PB_WEALTH_SOURCES.map((s) => (
            <label key={s.id} className="checkline service-card">
              <input type="checkbox" checked={values[wealthKey(s.id)] === true} onChange={(e) => onChange(wealthKey(s.id), e.target.checked)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
        <FieldError id="pb-wealth" errors={fieldErrors} />
        {values[wealthKey("other")] === true && (
          <label className="field" data-field="pb-wealth-other-text">
            <span>Please specify</span>
            <textarea value={String(values["pb-wealth-other-text"] ?? "")} onChange={(e) => onChange("pb-wealth-other-text", e.target.value)} />
            <FieldError id="pb-wealth-other-text" errors={fieldErrors} />
          </label>
        )}
        <p className="text-sm text-[var(--muted)] mt-4">
          The bank may request supporting documents during its application process.
        </p>
      </>
    );
  }

  if (step === 23) {
    const regular = String(values["pb-regular-transfers"] ?? "");
    const own = String(values["pb-own-funds"] ?? "");
    const incomingInactive = values["pb-incoming-none"] === true;
    const outgoingInactive = values["pb-outgoing-none"] === true;
    const selectedCurrencies = PB_CURRENCIES.filter((c) => values[currKey(c)] === true);

    return (
      <>
        <h2 className="text-lg font-semibold mt-0">Initial funding</h2>
        <label className="field" data-field="pb-own-funds">
          <span>Will the initial funds come from an account in your own name?</span>
          <select value={own} onChange={(e) => onChange("pb-own-funds", e.target.value)}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="Joint account including my name">Joint account including my name</option>
            <option value="No">No</option>
          </select>
          <FieldError id="pb-own-funds" errors={fieldErrors} />
        </label>
        {own === "No" && (
          <>
            <label className="field" data-field="pb-third-party-name">
              <span>Sender&apos;s name — optional, if known</span>
              <input value={String(values["pb-third-party-name"] ?? "")} onChange={(e) => onChange("pb-third-party-name", e.target.value)} />
            </label>
            <label className="field" data-field="pb-third-party-relationship">
              <span>Relationship to you</span>
              <select
                value={String(values["pb-third-party-relationship"] ?? "")}
                onChange={(e) => onChange("pb-third-party-relationship", e.target.value)}
              >
                <option value="">Select…</option>
                {PB_THIRD_PARTY_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <FieldError id="pb-third-party-relationship" errors={fieldErrors} />
            </label>
            {values["pb-third-party-relationship"] === "Other" && (
              <label className="field" data-field="pb-third-party-relationship-other">
                <span>Please describe the relationship</span>
                <input
                  value={String(values["pb-third-party-relationship-other"] ?? "")}
                  onChange={(e) => onChange("pb-third-party-relationship-other", e.target.value)}
                />
                <FieldError id="pb-third-party-relationship-other" errors={fieldErrors} />
              </label>
            )}
            <label className="field" data-field="pb-third-party-reason">
              <span>Brief reason for third-party funding</span>
              <textarea
                value={String(values["pb-third-party-reason"] ?? "")}
                onChange={(e) => onChange("pb-third-party-reason", e.target.value)}
                placeholder="Examples: Salary under an employment agreement; Dividends from my company; Payment for professional services under an invoice."
              />
              <FieldError id="pb-third-party-reason" errors={fieldErrors} />
            </label>
          </>
        )}
        <label className="field">
          <span>Sending bank / institution</span>
          <input value={String(values["pb-origin-bank"] ?? "")} onChange={(e) => onChange("pb-origin-bank", e.target.value)} />
        </label>
        <div data-field="pb-origin-country">
          <CountryMultiSelect
            id="pb-origin-country"
            label="Country / countries from which the initial transfer will be sent"
            required
            value={pickers["pb-origin-country"] ?? []}
            onChange={(next) => onPickerChange("pb-origin-country", next)}
          />
          <FieldError id="pb-origin-country" errors={fieldErrors} />
        </div>

        <h2 className="text-lg font-semibold">Ongoing account activity</h2>
        <label className="field" data-field="pb-regular-transfers">
          <span>Do you expect regular incoming or outgoing transfers?</span>
          <select value={regular} onChange={(e) => onChange("pb-regular-transfers", e.target.value)}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Not yet known">Not yet known</option>
          </select>
          <FieldError id="pb-regular-transfers" errors={fieldErrors} />
        </label>
        {regular === "Yes" && (
          <>
            <section className="panel">
              <h3>Incoming transfers</h3>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={incomingInactive}
                  onChange={(e) => onChange("pb-incoming-none", e.target.checked)}
                />
                <span>No regular incoming transfers expected</span>
              </label>
              {!incomingInactive && (
                <>
                  <div data-field="pb-incoming">
                    <CountryMultiSelect
                      id="pb-incoming"
                      label="Relevant countries"
                      required
                      value={pickers["pb-incoming"] ?? []}
                      onChange={(next) => onPickerChange("pb-incoming", next)}
                    />
                    <FieldError id="pb-incoming" errors={fieldErrors} />
                  </div>
                  {selectedCurrencies.map((code) => (
                    <div key={`in-${code}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <label className="field" data-field={inCountKey(code)}>
                        <span>Expected transactions per month ({code})</span>
                        <select
                          value={String(values[inCountKey(code)] ?? "")}
                          onChange={(e) => onChange(inCountKey(code), e.target.value)}
                        >
                          <option value="">Select…</option>
                          {PB_COUNT_BANDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <FieldError id={inCountKey(code)} errors={fieldErrors} />
                      </label>
                      <label className="field" data-field={inAmountKey(code)}>
                        <span>Expected total amount per month ({code})</span>
                        <select
                          value={String(values[inAmountKey(code)] ?? "")}
                          onChange={(e) => onChange(inAmountKey(code), e.target.value)}
                        >
                          <option value="">Select…</option>
                          {PB_AMOUNT_BANDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <FieldError id={inAmountKey(code)} errors={fieldErrors} />
                      </label>
                    </div>
                  ))}
                  {selectedCurrencies.length === 0 && (
                    <p className="text-sm text-[var(--muted)]">Select account currencies on the previous step to enter monthly estimates.</p>
                  )}
                  <p className="field-label mt-4">Purpose of incoming transfers</p>
                  <div className="checks-grid" data-field="pb-in-purposes">
                    {PB_INCOMING_PURPOSES.map((p) => (
                      <label key={p.id} className="checkline">
                        <input
                          type="checkbox"
                          checked={values[inPurposeKey(p.id)] === true}
                          onChange={(e) => onChange(inPurposeKey(p.id), e.target.checked)}
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError id="pb-in-purposes" errors={fieldErrors} />
                  {values[inPurposeKey("other")] === true && (
                    <label className="field" data-field="pb-in-purpose-other">
                      <span>Please specify</span>
                      <input value={String(values["pb-in-purpose-other"] ?? "")} onChange={(e) => onChange("pb-in-purpose-other", e.target.value)} />
                      <FieldError id="pb-in-purpose-other" errors={fieldErrors} />
                    </label>
                  )}
                  <label className="field">
                    <span>Additional explanation</span>
                    <textarea value={String(values["pb-in-notes"] ?? "")} onChange={(e) => onChange("pb-in-notes", e.target.value)} />
                  </label>
                </>
              )}
            </section>

            <section className="panel">
              <h3>Outgoing transfers</h3>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={outgoingInactive}
                  onChange={(e) => onChange("pb-outgoing-none", e.target.checked)}
                />
                <span>No regular outgoing transfers expected</span>
              </label>
              {!outgoingInactive && (
                <>
                  <div data-field="pb-outgoing">
                    <CountryMultiSelect
                      id="pb-outgoing"
                      label="Relevant countries"
                      required
                      value={pickers["pb-outgoing"] ?? []}
                      onChange={(next) => onPickerChange("pb-outgoing", next)}
                    />
                    <FieldError id="pb-outgoing" errors={fieldErrors} />
                  </div>
                  {selectedCurrencies.map((code) => (
                    <div key={`out-${code}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <label className="field" data-field={outCountKey(code)}>
                        <span>Expected transactions per month ({code})</span>
                        <select
                          value={String(values[outCountKey(code)] ?? "")}
                          onChange={(e) => onChange(outCountKey(code), e.target.value)}
                        >
                          <option value="">Select…</option>
                          {PB_COUNT_BANDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <FieldError id={outCountKey(code)} errors={fieldErrors} />
                      </label>
                      <label className="field" data-field={outAmountKey(code)}>
                        <span>Expected total amount per month ({code})</span>
                        <select
                          value={String(values[outAmountKey(code)] ?? "")}
                          onChange={(e) => onChange(outAmountKey(code), e.target.value)}
                        >
                          <option value="">Select…</option>
                          {PB_AMOUNT_BANDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <FieldError id={outAmountKey(code)} errors={fieldErrors} />
                      </label>
                    </div>
                  ))}
                  <p className="field-label mt-4">Purpose of outgoing transfers</p>
                  <div className="checks-grid" data-field="pb-out-purposes">
                    {PB_OUTGOING_PURPOSES.map((p) => (
                      <label key={p.id} className="checkline">
                        <input
                          type="checkbox"
                          checked={values[outPurposeKey(p.id)] === true}
                          onChange={(e) => onChange(outPurposeKey(p.id), e.target.checked)}
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError id="pb-out-purposes" errors={fieldErrors} />
                  {values[outPurposeKey("other")] === true && (
                    <label className="field" data-field="pb-out-purpose-other">
                      <span>Please specify</span>
                      <input value={String(values["pb-out-purpose-other"] ?? "")} onChange={(e) => onChange("pb-out-purpose-other", e.target.value)} />
                      <FieldError id="pb-out-purpose-other" errors={fieldErrors} />
                    </label>
                  )}
                  <label className="field">
                    <span>Additional explanation</span>
                    <textarea value={String(values["pb-out-notes"] ?? "")} onChange={(e) => onChange("pb-out-notes", e.target.value)} />
                  </label>
                </>
              )}
            </section>
            <FieldError id="pb-transfer-directions" errors={fieldErrors} />
          </>
        )}
      </>
    );
  }

  return null;
}
