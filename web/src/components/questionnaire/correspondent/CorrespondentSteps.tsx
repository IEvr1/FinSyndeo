"use client";

import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import { CountrySearchSelect } from "@/components/questionnaire/CountrySearchSelect";
import {
  CO_ACCOUNT_STRUCTURES,
  CO_AMOUNT_BANDS,
  CO_AMLRO_CHOICES,
  CO_CLIENT_TYPES,
  CO_COUNT_BANDS,
  CO_CURRENCIES,
  CO_INSTITUTION_CATEGORIES,
  CO_REGIONS,
  CO_REGULATORY_STATUS,
  CO_RELATIONSHIP_STATUS,
  CO_SERVICES,
  CO_UBO_COVERAGE_TARGET,
  activityDeclared,
  coClientTypeKey,
  coCurrKey,
  coCurrLevelKey,
  coRailKey,
  coRegionKey,
  coStructKey,
  coSvcKey,
  flowCountriesKey,
  flowKey,
  isInactiveActivity,
  newId,
  parseJsonList,
  railsForCurrency,
  type CoCorporateShareholder,
  type CoExistingProvider,
  type CoUbo,
  websiteUnavailableKey,
} from "@/lib/questionnaire/correspondent-config";
import type { CountryPickers, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  step: number;
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onChange: (key: string, value: FieldValue) => void;
  onPickerChange: (id: string, list: string[]) => void;
  fieldErrors?: Record<string, string>;
};

function FieldError({ id, errors }: { id: string; errors?: Record<string, string> }) {
  const msg = errors?.[id];
  if (!msg) return null;
  return (
    <p className="field-error" id={`${id}-error`} role="alert">
      {msg}
    </p>
  );
}

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
      <label className="checkline">
        <input type="radio" name={name} checked={value === "required"} onChange={() => onChange("required")} />
        <span>Must-have</span>
      </label>
      <label className="checkline">
        <input type="radio" name={name} checked={value !== "required"} onChange={() => onChange("preferred")} />
        <span>Good to have</span>
      </label>
    </div>
  );
}

function auditYears(): number[] {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2, y - 3, y - 4, y - 5];
}

function deactivateCategoryBranches(category: string, onChange: Props["onChange"]) {
  if (category !== "msb") {
    ["msb-office", "msb-director", "msb-boc", "msb-boc-reference", "msb-country", "msb-capital", "msb-portal", "msb-documents", "msb-cases", "msb-portfolio"].forEach(
      (k) => onChange(k, "")
    );
  }
  if (category !== "casp") {
    ["casp-mica", "casp-authority", "casp-reference", "casp-assets", "casp-wallets", "casp-travel", "casp-chain"].forEach(
      (k) => onChange(k, "")
    );
  }
}

function FlowSchedule({
  scope,
  currency,
  values,
  pickers,
  onChange,
  onPickerChange,
  fieldErrors,
}: {
  scope: "operating" | "client";
  currency: string;
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onChange: Props["onChange"];
  onPickerChange: Props["onPickerChange"];
  fieldErrors?: Record<string, string>;
}) {
  const title = scope === "operating" ? "Operating account (institution own funds)" : "Dedicated client-funds account";
  return (
    <div className="panel nested-panel mt-4">
      <h3 className="mt-0">
        {title} — {currency}
      </h3>
      {(["in", "out"] as const).map((dir) => {
        const amountKey = flowKey(scope, currency, dir, "amount");
        const countKey = flowKey(scope, currency, dir, "count");
        const purposeKey = flowKey(scope, currency, dir, "purpose");
        const countriesKey = flowCountriesKey(scope, currency, dir);
        const amount = String(values[amountKey] ?? "");
        const count = String(values[countKey] ?? "");
        const inactive = isInactiveActivity(amount) || isInactiveActivity(count);
        const needsDetail = activityDeclared(amount) || activityDeclared(count);
        const dirLabel = dir === "in" ? "Incoming" : "Outgoing";
        return (
          <div key={dir} className="mt-4" data-field={amountKey}>
            <p className="field-label">
              {dirLabel} monthly schedule ({currency})
            </p>
            <label className="field">
              <span>Expected monthly amount</span>
              <select value={amount} onChange={(e) => onChange(amountKey, e.target.value)}>
                <option value="">Select…</option>
                {CO_AMOUNT_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <FieldError id={amountKey} errors={fieldErrors} />
            <label className="field">
              <span>Expected monthly transaction count</span>
              <select value={count} onChange={(e) => onChange(countKey, e.target.value)}>
                <option value="">Select…</option>
                {CO_COUNT_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <FieldError id={countKey} errors={fieldErrors} />
            {!inactive && needsDetail && (
              <>
                <CountryMultiSelect
                  id={countriesKey}
                  label={`Main ${dirLabel.toLowerCase()} countries`}
                  required
                  value={pickers[countriesKey] ?? []}
                  onChange={(next) => onPickerChange(countriesKey, next)}
                />
                <FieldError id={countriesKey} errors={fieldErrors} />
                <label className="field">
                  <span>Purpose</span>
                  <textarea
                    rows={2}
                    value={String(values[purposeKey] ?? "")}
                    onChange={(e) => onChange(purposeKey, e.target.value)}
                    placeholder="Describe how these funds will be used"
                  />
                </label>
                <FieldError id={purposeKey} errors={fieldErrors} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IdentityStep({ values, onChange, fieldErrors }: Pick<Props, "values" | "onChange" | "fieldErrors">) {
  const unavailable = values[websiteUnavailableKey()] === true;
  return (
    <>
      <p className="field-label">Institution category</p>
      <p className="text-sm text-[var(--muted)] mb-3">Select one. There is no default.</p>
      <div className="service-card-grid" data-field="co-institution-category">
        {CO_INSTITUTION_CATEGORIES.map((c) => (
          <label key={c.id} className={`service-card ${values["co-institution-category"] === c.id ? "service-card-on" : ""}`}>
            <input
              type="radio"
              name="co-institution-category"
              checked={values["co-institution-category"] === c.id}
              onChange={() => {
                onChange("co-institution-category", c.id);
                deactivateCategoryBranches(c.id, onChange);
              }}
            />
            <span className="service-card-title">{c.label}</span>
          </label>
        ))}
      </div>
      <FieldError id="co-institution-category" errors={fieldErrors} />

      <label className="field" data-field="company-name">
        <span>Registered legal name</span>
        <input
          type="text"
          value={String(values["company-name"] ?? "")}
          onChange={(e) => onChange("company-name", e.target.value)}
          autoComplete="organization"
        />
      </label>
      <FieldError id="company-name" errors={fieldErrors} />

      <div data-field="incorporation">
        <CountrySearchSelect
          id="incorporation"
          label="Country of incorporation"
          required
          value={String(values.incorporation ?? "")}
          onChange={(v) => onChange("incorporation", v)}
        />
      </div>
      <FieldError id="incorporation" errors={fieldErrors} />

      <label className="field" data-field="registration">
        <span>Registration number</span>
        <input
          type="text"
          value={String(values.registration ?? "")}
          onChange={(e) => onChange("registration", e.target.value)}
          disabled={values["registration-notissued"] === true}
        />
      </label>
      <label className="checkline">
        <input
          type="checkbox"
          checked={values["registration-notissued"] === true}
          onChange={(e) => onChange("registration-notissued", e.target.checked)}
        />
        <span>No official identifier is issued for this entity</span>
      </label>
      <FieldError id="registration" errors={fieldErrors} />
      {values["registration-notissued"] === true && (
        <>
          <label className="field" data-field="registration-exception-reason">
            <span>Explain the identifier exception</span>
            <textarea
              rows={2}
              value={String(values["registration-exception-reason"] ?? "")}
              onChange={(e) => onChange("registration-exception-reason", e.target.value)}
            />
          </label>
          <FieldError id="registration-exception-reason" errors={fieldErrors} />
        </>
      )}

      <label className="field" data-field="fi-website">
        <span>Institution website</span>
        <input
          type="url"
          value={String(values["fi-website"] ?? "")}
          onChange={(e) => onChange("fi-website", e.target.value)}
          disabled={unavailable}
          placeholder="https://"
        />
      </label>
      <label className="checkline">
        <input
          type="checkbox"
          checked={unavailable}
          onChange={(e) => {
            onChange(websiteUnavailableKey(), e.target.checked);
            if (e.target.checked) onChange("fi-website", "");
          }}
        />
        <span>Website unavailable or under development</span>
      </label>
      <FieldError id="fi-website" errors={fieldErrors} />
      {unavailable && (
        <>
          <label className="field" data-field="co-website-reason">
            <span>Explain why the website is unavailable or under development</span>
            <textarea
              rows={2}
              value={String(values["co-website-reason"] ?? "")}
              onChange={(e) => onChange("co-website-reason", e.target.value)}
            />
          </label>
          <FieldError id="co-website-reason" errors={fieldErrors} />
        </>
      )}
      <FieldError id="entity-type" errors={fieldErrors} />
    </>
  );
}

function ProfileStep({ values, onChange, fieldErrors }: Pick<Props, "values" | "onChange" | "fieldErrors">) {
  const category = String(values["co-institution-category"] ?? "");
  const incorporation = String(values.incorporation ?? "");
  const isMsbCanada = category === "msb" && /canada/i.test(incorporation);
  const isCasp = category === "casp";
  const catLabel = CO_INSTITUTION_CATEGORIES.find((c) => c.id === category)?.label ?? category;

  return (
    <>
      <p className="text-sm text-[var(--muted)] mb-4">
        Institution category: <strong>{catLabel || "Not selected"}</strong>
        {incorporation ? ` · Incorporated in ${incorporation}` : ""}. Regulatory questions follow this category.
      </p>

      <label className="field" data-field="fi-status">
        <span>Regulatory status</span>
        <select value={String(values["fi-status"] ?? "")} onChange={(e) => onChange("fi-status", e.target.value)}>
          <option value="">Select…</option>
          {CO_REGULATORY_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <FieldError id="fi-status" errors={fieldErrors} />

      <label className="field" data-field="fi-regulatory">
        <span>Regulator or issuing authority</span>
        <textarea
          rows={2}
          value={String(values["fi-regulatory"] ?? "")}
          onChange={(e) => onChange("fi-regulatory", e.target.value)}
        />
      </label>
      <FieldError id="fi-regulatory" errors={fieldErrors} />

      <label className="field" data-field="fi-reference">
        <span>Licence or registration reference</span>
        <input
          type="text"
          value={String(values["fi-reference"] ?? "")}
          onChange={(e) => onChange("fi-reference", e.target.value)}
        />
      </label>
      <FieldError id="fi-reference" errors={fieldErrors} />

      <label className="field">
        <span>Official register link (optional)</span>
        <input
          type="url"
          value={String(values["fi-register-link"] ?? "")}
          onChange={(e) => onChange("fi-register-link", e.target.value)}
          placeholder="https://"
        />
      </label>

      <label className="field">
        <span>Permitted activities (optional)</span>
        <textarea
          rows={2}
          value={String(values["fi-permitted"] ?? "")}
          onChange={(e) => onChange("fi-permitted", e.target.value)}
        />
      </label>

      <label className="field">
        <span>Briefly describe your financial services and operating model (optional)</span>
        <textarea
          rows={3}
          value={String(values["fi-activities"] ?? "")}
          onChange={(e) => onChange("fi-activities", e.target.value)}
        />
      </label>

      {isMsbCanada && (
        <div className="panel nested-panel mt-4">
          <h3 className="mt-0">Canadian MSB substance</h3>
          <p className="text-sm text-[var(--muted)]">
            Shown only for Money services businesses incorporated in Canada.
          </p>
          <label className="field" data-field="msb-office">
            <span>Do you have a staffed operating office in Canada?</span>
            <select value={String(values["msb-office"] ?? "")} onChange={(e) => onChange("msb-office", e.target.value)}>
              <option value="">Select…</option>
              <option value="Yes — dedicated office">Yes — dedicated office</option>
              <option value="Yes — staffed shared office">Yes — staffed shared office</option>
              <option value="Registered / mailing address only">Registered / mailing address only</option>
              <option value="No">No</option>
            </select>
          </label>
          <FieldError id="msb-office" errors={fieldErrors} />
          <label className="field" data-field="msb-director">
            <span>Is at least one director based in Canada?</span>
            <select value={String(values["msb-director"] ?? "")} onChange={(e) => onChange("msb-director", e.target.value)}>
              <option value="">Select…</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not applicable — no directors">Not applicable — no directors</option>
            </select>
          </label>
          <FieldError id="msb-director" errors={fieldErrors} />
          <label className="field" data-field="msb-boc">
            <span>Bank of Canada PSP registration status</span>
            <select value={String(values["msb-boc"] ?? "")} onChange={(e) => onChange("msb-boc", e.target.value)}>
              <option value="">Select…</option>
              <option value="Registered">Registered</option>
              <option value="Application submitted / listed as applicant">Application submitted / listed as applicant</option>
              <option value="Not applied">Not applied</option>
              <option value="Not in scope — subject to review">Not in scope — subject to review</option>
            </select>
          </label>
          <FieldError id="msb-boc" errors={fieldErrors} />
          <label className="field">
            <span>Bank of Canada reference or register link (optional)</span>
            <input
              type="text"
              value={String(values["msb-boc-reference"] ?? "")}
              onChange={(e) => onChange("msb-boc-reference", e.target.value)}
            />
          </label>
        </div>
      )}

      {isCasp && (
        <div className="panel nested-panel mt-4">
          <h3 className="mt-0">Crypto asset service provider</h3>
          <p className="text-sm text-[var(--muted)]">
            MiCA applies only where you state EU activity. Pending, unavailable or not applicable answers are allowed
            where truthful.
          </p>
          <label className="field" data-field="casp-mica">
            <span>MiCA status</span>
            <select value={String(values["casp-mica"] ?? "")} onChange={(e) => onChange("casp-mica", e.target.value)}>
              <option value="">Select…</option>
              <option value="Authorised under MiCA">Authorised under MiCA</option>
              <option value="Eligible financial entity — Article 60 notification">
                Eligible financial entity — Article 60 notification
              </option>
              <option value="Application pending">Application pending</option>
              <option value="No MiCA authorisation">No MiCA authorisation</option>
              <option value="Not applicable — no EU services, subject to review">
                Not applicable — no EU services, subject to review
              </option>
            </select>
          </label>
          <FieldError id="casp-mica" errors={fieldErrors} />
          <label className="field">
            <span>MiCA competent authority (if applicable)</span>
            <input
              type="text"
              value={String(values["casp-authority"] ?? "")}
              onChange={(e) => onChange("casp-authority", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Authorisation / notification reference (if applicable)</span>
            <input
              type="text"
              value={String(values["casp-reference"] ?? "")}
              onChange={(e) => onChange("casp-reference", e.target.value)}
            />
          </label>
          <label className="field" data-field="casp-assets">
            <span>Crypto-assets and networks supported</span>
            <textarea
              rows={2}
              value={String(values["casp-assets"] ?? "")}
              onChange={(e) => onChange("casp-assets", e.target.value)}
            />
          </label>
          <FieldError id="casp-assets" errors={fieldErrors} />
          <label className="field" data-field="casp-wallets">
            <span>Do you support transfers to or from self-hosted wallets?</span>
            <select value={String(values["casp-wallets"] ?? "")} onChange={(e) => onChange("casp-wallets", e.target.value)}>
              <option value="">Select…</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not applicable">Not applicable</option>
            </select>
          </label>
          <FieldError id="casp-wallets" errors={fieldErrors} />
          <label className="field" data-field="casp-travel">
            <span>Travel Rule arrangements</span>
            <select value={String(values["casp-travel"] ?? "")} onChange={(e) => onChange("casp-travel", e.target.value)}>
              <option value="">Select…</option>
              <option value="Implemented">Implemented</option>
              <option value="In development">In development</option>
              <option value="Not applicable — subject to review">Not applicable — subject to review</option>
            </select>
          </label>
          <FieldError id="casp-travel" errors={fieldErrors} />
          <label className="field" data-field="casp-chain">
            <span>Blockchain transaction screening</span>
            <select value={String(values["casp-chain"] ?? "")} onChange={(e) => onChange("casp-chain", e.target.value)}>
              <option value="">Select…</option>
              <option value="Implemented">Implemented</option>
              <option value="In development">In development</option>
              <option value="Not implemented">Not implemented</option>
            </select>
          </label>
          <FieldError id="casp-chain" errors={fieldErrors} />
        </div>
      )}
    </>
  );
}

function ClientsStep({
  values,
  pickers,
  onChange,
  onPickerChange,
  fieldErrors,
}: Props) {
  const nested = String(values["fi-downstream"] ?? "");
  const access = String(values["fi-access"] ?? "");
  return (
    <>
      <p className="field-label">Underlying client types</p>
      <div className="checks spaced-checks" data-field="co-clients">
        {CO_CLIENT_TYPES.map((t) => (
          <label key={t.id} className="checkline">
            <input
              type="checkbox"
              checked={values[coClientTypeKey(t.id)] === true}
              onChange={(e) => onChange(coClientTypeKey(t.id), e.target.checked)}
            />
            <span>{t.label}</span>
          </label>
        ))}
      </div>
      <FieldError id="co-clients" errors={fieldErrors} />

      <label className="field" data-field="fi-client-profile">
        <span>Main client industries and business activities</span>
        <textarea
          rows={3}
          value={String(values["fi-client-profile"] ?? "")}
          onChange={(e) => onChange("fi-client-profile", e.target.value)}
        />
      </label>
      <FieldError id="fi-client-profile" errors={fieldErrors} />

      <p className="field-label">Broad regions (optional context)</p>
      <p className="text-sm text-[var(--muted)] mb-2">Regions do not replace specific country disclosure.</p>
      <div className="checks spaced-checks">
        {CO_REGIONS.map((r) => (
          <label key={r} className="checkline">
            <input
              type="checkbox"
              checked={values[coRegionKey(r)] === true}
              onChange={(e) => onChange(coRegionKey(r), e.target.checked)}
            />
            <span>{r}</span>
          </label>
        ))}
      </div>

      <div data-field="fi-underlying-countries">
        <CountryMultiSelect
          id="fi-underlying-countries"
          label="Specific underlying client countries"
          required
          value={pickers["fi-underlying-countries"] ?? []}
          onChange={(next) => onPickerChange("fi-underlying-countries", next)}
        />
      </div>
      <FieldError id="fi-underlying-countries" errors={fieldErrors} />

      <label className="field" data-field="fi-downstream">
        <span>Will you process payments for other financial institutions and their customers?</span>
        <select
          value={nested}
          onChange={(e) => {
            onChange("fi-downstream", e.target.value);
            if (e.target.value !== "Yes") onChange("fi-downstream-text", "");
          }}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Not yet determined">Not yet determined</option>
        </select>
      </label>
      <FieldError id="fi-downstream" errors={fieldErrors} />
      {nested === "Yes" && (
        <>
          <label className="field" data-field="fi-downstream-text">
            <span>Describe those institutions, their countries and the customers they serve</span>
            <textarea
              rows={3}
              value={String(values["fi-downstream-text"] ?? "")}
              onChange={(e) => onChange("fi-downstream-text", e.target.value)}
            />
          </label>
          <FieldError id="fi-downstream-text" errors={fieldErrors} />
        </>
      )}

      <label className="field" data-field="fi-access">
        <span>Can underlying clients directly access or operate the account?</span>
        <select
          value={access}
          onChange={(e) => {
            onChange("fi-access", e.target.value);
            if (e.target.value !== "Yes") onChange("fi-access-text", "");
          }}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Not yet determined">Not yet determined</option>
        </select>
      </label>
      <p className="text-sm text-[var(--muted)]">
        Direct access is separate from API connectivity, virtual accounts, pooled accounts or nested processing.
      </p>
      <FieldError id="fi-access" errors={fieldErrors} />
      {access === "Yes" && (
        <>
          <label className="field" data-field="fi-access-text">
            <span>Explain access and controls</span>
            <textarea
              rows={3}
              value={String(values["fi-access-text"] ?? "")}
              onChange={(e) => onChange("fi-access-text", e.target.value)}
            />
          </label>
          <FieldError id="fi-access-text" errors={fieldErrors} />
        </>
      )}
    </>
  );
}

function ServicesStep({
  values,
  pickers,
  onChange,
  onPickerChange,
  fieldErrors,
}: Props) {
  const clientFunds = values["co-client-funds"] === true;
  const safeguardingOn = values[coSvcKey("client_funds_safeguarding")] === true;

  return (
    <>
      <p className="field-label">Account types</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        An operating account for the institution’s own funds is the baseline for this assessment. A dedicated
        client-funds account is optional and must be selected explicitly.
      </p>
      <div className="service-card service-card-on mb-3">
        <span className="service-card-title">Operating account — institution own funds</span>
        <span className="service-card-desc">Baseline account for the institution’s own money. Always included.</span>
      </div>
      <label className={`service-card ${clientFunds ? "service-card-on" : ""}`} data-field="co-client-funds">
        <input
          type="checkbox"
          checked={clientFunds}
          onChange={(e) => {
            onChange("co-client-funds", e.target.checked);
            if (!e.target.checked && safeguardingOn) {
              /* keep safeguarding selected; validation will require reconfirming client funds */
            }
          }}
        />
        <span className="service-card-title">Dedicated client-funds account</span>
        <span className="service-card-desc">Hold client money separately from the institution’s own funds.</span>
      </label>
      <FieldError id="co-client-funds" errors={fieldErrors} />

      <p className="field-label mt-6">Account structures (optional)</p>
      <div className="checks spaced-checks">
        {CO_ACCOUNT_STRUCTURES.map((s) => (
          <label key={s.id} className="checkline">
            <input
              type="checkbox"
              checked={values[coStructKey(s.id)] === true}
              onChange={(e) => onChange(coStructKey(s.id), e.target.checked)}
            />
            <span>{s.label}</span>
          </label>
        ))}
      </div>
      <p className="text-sm text-[var(--muted)]">
        Virtual IBANs and crypto wallets are distinct capabilities. A pooled account does not imply individual client
        accounts or permission for nested institutions.
      </p>

      <p className="field-label mt-6">Additional services</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        Optional to select — once selected, each service is a requested essential capability for matching unless marked
        for discussion. BaaS does not include White Label, issuing, custody, ramps or safeguarding.
      </p>
      <div className="service-card-grid">
        {CO_SERVICES.map((s) => {
          const on = values[coSvcKey(s.id)] === true;
          return (
            <div key={s.id} className={`service-card ${on ? "service-card-on" : ""}`}>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (s.id === "client_funds_safeguarding" && checked && !clientFunds) {
                      const ok = window.confirm(
                        "Safeguarding of client funds requires a dedicated client-funds account. Select the client-funds account now?"
                      );
                      if (ok) onChange("co-client-funds", true);
                      else return;
                    }
                    onChange(coSvcKey(s.id), checked);
                  }}
                />
                <span>{s.label}</span>
              </label>
              {"hint" in s && s.hint ? <p className="text-sm text-[var(--muted)] mt-1">{s.hint}</p> : null}
            </div>
          );
        })}
      </div>
      {values[coSvcKey("other")] === true && (
        <>
          <label className="field" data-field="co-svc-other-text">
            <span>Describe the other service</span>
            <textarea
              rows={2}
              value={String(values["co-svc-other-text"] ?? "")}
              onChange={(e) => onChange("co-svc-other-text", e.target.value)}
            />
          </label>
          <FieldError id="co-svc-other-text" errors={fieldErrors} />
        </>
      )}

      <p className="field-label mt-6">Currencies</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        A missing Must-have prevents a suitable match; a missing Good to have does not exclude the provider. Select at
        least one currency.
      </p>
      <div className="service-card-grid" data-field="co-currencies">
        {CO_CURRENCIES.map((code) => {
          const on = values[coCurrKey(code)] === true;
          return (
            <div key={code} className={`service-card ${on ? "service-card-on" : ""}`}>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => onChange(coCurrKey(code), e.target.checked)}
                />
                <span>{code}</span>
              </label>
              {on && (
                <>
                  <LevelToggle
                    name={`co-level-${code}`}
                    value={String(values[coCurrLevelKey(code)] ?? "preferred")}
                    onChange={(v) => onChange(coCurrLevelKey(code), v)}
                  />
                  <p className="field-label mt-2">Payment rails (optional)</p>
                  <p className="text-sm text-[var(--muted)]">
                    Rails inherit this currency’s priority. No rail selected means no specific rail preference.
                  </p>
                  <div className="checks spaced-checks">
                    {railsForCurrency(code).map((r) => (
                      <label key={r.id} className="checkline">
                        <input
                          type="checkbox"
                          checked={values[coRailKey(r.id)] === true}
                          onChange={(e) => onChange(coRailKey(r.id), e.target.checked)}
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
      <FieldError id="co-currencies" errors={fieldErrors} />

      <label className="field mt-4" data-field="fi-fund-model">
        <span>Whose money will be held or transferred, and how will the account be used?</span>
        <textarea
          rows={3}
          value={String(values["fi-fund-model"] ?? "")}
          onChange={(e) => onChange("fi-fund-model", e.target.value)}
        />
      </label>
      <FieldError id="fi-fund-model" errors={fieldErrors} />

      {CO_CURRENCIES.filter((c) => values[coCurrKey(c)] === true).map((code) => (
        <div key={code}>
          <FlowSchedule
            scope="operating"
            currency={code}
            values={values}
            pickers={pickers}
            onChange={onChange}
            onPickerChange={onPickerChange}
            fieldErrors={fieldErrors}
          />
          {clientFunds && (
            <FlowSchedule
              scope="client"
              currency={code}
              values={values}
              pickers={pickers}
              onChange={onChange}
              onPickerChange={onPickerChange}
              fieldErrors={fieldErrors}
            />
          )}
        </div>
      ))}
    </>
  );
}

function ComplianceStep({ values, onChange, fieldErrors }: Pick<Props, "values" | "onChange" | "fieldErrors">) {
  const audit = String(values["fi-audit"] ?? "");
  return (
    <>
      <label className="field" data-field="fi-mlro">
        <span>AMLRO</span>
        <select
          value={String(values["fi-mlro"] ?? "")}
          onChange={(e) => onChange("fi-mlro", e.target.value)}
        >
          <option value="">Select…</option>
          {CO_AMLRO_CHOICES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <FieldError id="fi-mlro" errors={fieldErrors} />

      <div data-field="fi-mlro-country">
        <CountrySearchSelect
          id="fi-mlro-country"
          label="Country where the AMLRO is based"
          required
          value={String(values["fi-mlro-country"] ?? "")}
          onChange={(v) => onChange("fi-mlro-country", v)}
        />
      </div>
      <FieldError id="fi-mlro-country" errors={fieldErrors} />

      <label className="field" data-field="fi-aml">
        <span>Do you have documented AML/KYC, sanctions-screening and transaction-monitoring controls?</span>
        <select value={String(values["fi-aml"] ?? "")} onChange={(e) => onChange("fi-aml", e.target.value)}>
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="Partly / in development">Partly / in development</option>
          <option value="No">No</option>
        </select>
      </label>
      <p className="text-sm text-[var(--muted)]">An answer is not verification of control effectiveness.</p>
      <FieldError id="fi-aml" errors={fieldErrors} />

      <label className="field" data-field="fi-audit">
        <span>Is a recent independent AML review or audit available?</span>
        <select
          value={audit}
          onChange={(e) => {
            onChange("fi-audit", e.target.value);
            if (e.target.value !== "Yes") onChange("fi-audit-year", "");
          }}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </label>
      <FieldError id="fi-audit" errors={fieldErrors} />
      {audit === "Yes" && (
        <>
          <label className="field" data-field="fi-audit-year">
            <span>Year of the review</span>
            <select
              value={String(values["fi-audit-year"] ?? "")}
              onChange={(e) => onChange("fi-audit-year", e.target.value)}
            >
              <option value="">Select…</option>
              {auditYears().map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <FieldError id="fi-audit-year" errors={fieldErrors} />
        </>
      )}
    </>
  );
}

function RelationshipsStep({ values, onChange, fieldErrors }: Pick<Props, "values" | "onChange" | "fieldErrors">) {
  const rows = parseJsonList<CoExistingProvider>(values["co-existing-providers"]);

  function save(next: CoExistingProvider[]) {
    onChange("co-existing-providers", JSON.stringify(next));
  }

  return (
    <>
      <p className="lead">Existing correspondent and payment relationships</p>
      <p className="text-sm text-[var(--muted)] mb-4">
        Optional. You may continue with the reason alone if you have no existing providers. Do not enter account
        numbers.
      </p>
      {rows.map((row, idx) => (
        <div key={row.id} className="panel nested-panel mb-3" data-field={`co-existing-${row.id}`}>
          <div className="flex justify-between items-center gap-3 mb-2">
            <h3 className="mt-0 mb-0">Provider {idx + 1}</h3>
            <button type="button" className="mini" onClick={() => save(rows.filter((r) => r.id !== row.id))}>
              Remove
            </button>
          </div>
          <label className="field">
            <span>Provider name</span>
            <input
              type="text"
              value={row.name}
              onChange={(e) =>
                save(rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))
              }
            />
          </label>
          <CountrySearchSelect
            id={`co-existing-country-${row.id}`}
            label="Country"
            value={row.country}
            onChange={(v) => save(rows.map((r) => (r.id === row.id ? { ...r, country: v } : r)))}
          />
          <label className="field">
            <span>Relationship status</span>
            <select
              value={row.status}
              onChange={(e) =>
                save(rows.map((r) => (r.id === row.id ? { ...r, status: e.target.value } : r)))
              }
            >
              <option value="">Select…</option>
              {CO_RELATIONSHIP_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <FieldError id={`co-existing-${row.id}`} errors={fieldErrors} />
        </div>
      ))}
      <button
        type="button"
        className="btn mb-4"
        onClick={() =>
          save([...rows, { id: newId("prov"), name: "", country: "", status: "" }])
        }
      >
        Add existing provider
      </button>

      <label className="field" data-field="fi-reason">
        <span>Why are you seeking this relationship?</span>
        <textarea
          rows={3}
          value={String(values["fi-reason"] ?? "")}
          onChange={(e) => onChange("fi-reason", e.target.value)}
          placeholder="e.g. additional payment connectivity, replacement provider, or service expansion"
        />
      </label>
      <FieldError id="fi-reason" errors={fieldErrors} />
    </>
  );
}

function OwnershipStep({
  values,
  pickers,
  onChange,
  onPickerChange,
  fieldErrors,
}: Props) {
  const corp = String(values.corporate ?? "");
  const group = String(values.group ?? "");
  const corps = parseJsonList<CoCorporateShareholder>(values["co-corporate-shareholders"]);
  const ubos = parseJsonList<CoUbo>(values["co-ubos"]);

  function saveCorps(next: CoCorporateShareholder[]) {
    onChange("co-corporate-shareholders", JSON.stringify(next));
  }
  function saveUbos(next: CoUbo[]) {
    onChange("co-ubos", JSON.stringify(next));
  }

  const uboTotal = ubos.reduce((sum, u) => sum + (Number(u.ownership) || 0), 0);

  return (
    <>
      <label className="field" data-field="corporate">
        <span>Are any shareholders legal entities?</span>
        <select
          value={corp}
          onChange={(e) => {
            onChange("corporate", e.target.value);
            if (e.target.value !== "Yes") saveCorps([]);
          }}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </label>
      <FieldError id="corporate" errors={fieldErrors} />

      {corp === "Yes" && (
        <div data-field="co-corporate-shareholders">
          <p className="text-sm text-[var(--muted)] mb-2">
            Capture each corporate shareholder’s incorporation jurisdiction and shareholding in the applicant company
            (%). Look through to natural-person UBOs below — do not treat a shareholder company as a UBO.
          </p>
          {corps.map((row, idx) => (
            <div key={row.id} className="panel nested-panel mb-3">
              <div className="flex justify-between items-center gap-3 mb-2">
                <h3 className="mt-0 mb-0">Corporate shareholder {idx + 1}</h3>
                <button type="button" className="mini" onClick={() => saveCorps(corps.filter((r) => r.id !== row.id))}>
                  Remove
                </button>
              </div>
              <CountrySearchSelect
                id={`co-corp-j-${row.id}`}
                label="Incorporation jurisdiction"
                required
                value={row.jurisdiction}
                onChange={(v) =>
                  saveCorps(corps.map((r) => (r.id === row.id ? { ...r, jurisdiction: v } : r)))
                }
              />
              <FieldError id={`co-corp-${row.id}-jurisdiction`} errors={fieldErrors} />
              <label className="field">
                <span>Shareholding in the applicant company (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={row.shareholding}
                  onChange={(e) =>
                    saveCorps(corps.map((r) => (r.id === row.id ? { ...r, shareholding: e.target.value } : r)))
                  }
                />
              </label>
              <FieldError id={`co-corp-${row.id}-pct`} errors={fieldErrors} />
            </div>
          ))}
          <button
            type="button"
            className="btn mb-4"
            onClick={() => saveCorps([...corps, { id: newId("corp"), jurisdiction: "", shareholding: "" }])}
          >
            Add corporate shareholder
          </button>
          <FieldError id="co-corporate-shareholders" errors={fieldErrors} />
        </div>
      )}

      <h3>Ultimate beneficial owners</h3>
      <p className="text-sm text-[var(--muted)] mb-3">
        A UBO is a natural person, not a shareholder company. Do not enter personal names or identity documents at this
        initial assessment. Aim for at least {CO_UBO_COVERAGE_TARGET}% coverage; this is a questionnaire target, not a
        statutory KYC threshold.
      </p>
      {ubos.map((ubo, idx) => {
        const natKey = `co-ubo-nat-${ubo.id}`;
        const singleNat = (pickers[natKey] ?? ubo.nationalities ?? []).length === 1
          ? (pickers[natKey] ?? ubo.nationalities)[0]
          : "";
        return (
          <div key={ubo.id} className="panel nested-panel mb-3" data-field={`co-ubo-${ubo.id}-pct`}>
            <div className="flex justify-between items-center gap-3 mb-2">
              <h3 className="mt-0 mb-0">UBO {idx + 1}</h3>
              <button type="button" className="mini" onClick={() => saveUbos(ubos.filter((u) => u.id !== ubo.id))}>
                Remove
              </button>
            </div>
            <label className="field">
              <span>Beneficial ownership of the applicant company (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={ubo.ownership}
                onChange={(e) =>
                  saveUbos(ubos.map((u) => (u.id === ubo.id ? { ...u, ownership: e.target.value } : u)))
                }
              />
            </label>
            <FieldError id={`co-ubo-${ubo.id}-pct`} errors={fieldErrors} />
            <CountryMultiSelect
              id={natKey}
              label="Nationality or nationalities"
              required
              value={pickers[natKey] ?? ubo.nationalities ?? []}
              onChange={(next) => {
                onPickerChange(natKey, next);
                saveUbos(
                  ubos.map((u) =>
                    u.id === ubo.id
                      ? {
                          ...u,
                          nationalities: next,
                          residence: u.sameAsNationality && next.length === 1 ? next[0] : u.residence,
                        }
                      : u
                  )
                );
              }}
            />
            <FieldError id={`co-ubo-${ubo.id}-nat`} errors={fieldErrors} />
            {singleNat && (
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={ubo.sameAsNationality && ubo.residence === singleNat}
                  onChange={(e) => {
                    const on = e.target.checked;
                    saveUbos(
                      ubos.map((u) =>
                        u.id === ubo.id
                          ? { ...u, sameAsNationality: on, residence: on ? singleNat : u.residence }
                          : u
                      )
                    );
                  }}
                />
                <span>Same country of residence as nationality</span>
              </label>
            )}
            <CountrySearchSelect
              id={`co-ubo-res-${ubo.id}`}
              label="Country of residence"
              required
              value={ubo.residence}
              onChange={(v) =>
                saveUbos(
                  ubos.map((u) =>
                    u.id === ubo.id ? { ...u, residence: v, sameAsNationality: singleNat !== "" && v === singleNat } : u
                  )
                )
              }
            />
            <FieldError id={`co-ubo-${ubo.id}-res`} errors={fieldErrors} />
          </div>
        );
      })}
      <button
        type="button"
        className="btn mb-2"
        onClick={() =>
          saveUbos([
            ...ubos,
            { id: newId("ubo"), ownership: "", nationalities: [], residence: "", sameAsNationality: false },
          ])
        }
      >
        Add UBO
      </button>
      <p className="text-sm text-[var(--muted)] mb-3">Current UBO coverage: {uboTotal.toFixed(2)}%</p>
      <FieldError id="co-ubos" errors={fieldErrors} />

      <label className="field" data-field="ownership-clarification">
        <span>Ownership or control clarification (required if coverage is below {CO_UBO_COVERAGE_TARGET}%)</span>
        <textarea
          rows={3}
          value={String(values["ownership-clarification"] ?? "")}
          onChange={(e) => onChange("ownership-clarification", e.target.value)}
          placeholder="Explain remaining ownership, control without ownership, or why the target cannot be met"
        />
      </label>
      <FieldError id="ownership-clarification" errors={fieldErrors} />

      <label className="field" data-field="group">
        <span>Is your company part of a group?</span>
        <select
          value={group}
          onChange={(e) => {
            onChange("group", e.target.value);
            if (e.target.value !== "Yes") onChange("group-name", "");
          }}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </label>
      <FieldError id="group" errors={fieldErrors} />
      {group === "Yes" && (
        <label className="field">
          <span>Group name (optional)</span>
          <input
            type="text"
            value={String(values["group-name"] ?? "")}
            onChange={(e) => onChange("group-name", e.target.value)}
          />
        </label>
      )}

      <label className="field">
        <span>Do you want the same institution to serve other group companies? (optional)</span>
        <select
          value={String(values["group-same-institution"] ?? "")}
          onChange={(e) => onChange("group-same-institution", e.target.value)}
        >
          <option value="">Select a preference</option>
          <option value="Yes — this is essential when choosing the institution">
            Yes — this is essential when choosing the institution
          </option>
          <option value="Yes — preferred, but not essential">Yes — preferred, but not essential</option>
          <option value="No">No</option>
          <option value="Not yet decided">Not yet decided</option>
        </select>
      </label>
      <label className="field">
        <span>Do you want the same institution to offer a personal account to a UBO? (optional)</span>
        <select
          value={String(values["group-ubo-personal"] ?? "")}
          onChange={(e) => onChange("group-ubo-personal", e.target.value)}
        >
          <option value="">Select a preference</option>
          <option value="Yes — this is essential when choosing the institution">
            Yes — this is essential when choosing the institution
          </option>
          <option value="Yes — preferred, but not essential">Yes — preferred, but not essential</option>
          <option value="No">No</option>
          <option value="Not yet decided">Not yet decided</option>
        </select>
      </label>
    </>
  );
}

export function CorrespondentSteps({
  step,
  values,
  pickers,
  onChange,
  onPickerChange,
  fieldErrors,
}: Props) {
  if (step === 1) return <IdentityStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  if (step === 30) return <ProfileStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  if (step === 31) {
    return (
      <ClientsStep
        step={step}
        values={values}
        pickers={pickers}
        onChange={onChange}
        onPickerChange={onPickerChange}
        fieldErrors={fieldErrors}
      />
    );
  }
  if (step === 32) {
    return (
      <ServicesStep
        step={step}
        values={values}
        pickers={pickers}
        onChange={onChange}
        onPickerChange={onPickerChange}
        fieldErrors={fieldErrors}
      />
    );
  }
  if (step === 33) return <ComplianceStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  if (step === 39) return <RelationshipsStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  if (step === 4) {
    return (
      <OwnershipStep
        step={step}
        values={values}
        pickers={pickers}
        onChange={onChange}
        onPickerChange={onPickerChange}
        fieldErrors={fieldErrors}
      />
    );
  }
  return null;
}
