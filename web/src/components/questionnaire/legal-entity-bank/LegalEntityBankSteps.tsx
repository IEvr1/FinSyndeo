"use client";

import type { ReactNode } from "react";
import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import { CountrySearchSelect } from "@/components/questionnaire/CountrySearchSelect";
import {
  LE_ACCOUNTS,
  LE_AMOUNT_BANDS,
  LE_COUNT_BANDS,
  LE_CURRENCIES,
  LE_EMPLOYEE_BANDS,
  LE_EXISTING_BANKING,
  LE_INDUSTRIES,
  LE_LICENCE_ANSWERS,
  LE_MAX_ROWS,
  LE_NONSHARE_ROLES,
  LE_OFFICE_MODES,
  LE_PARTNER_ROUTES,
  LE_PRIORITY_EXPLANATION,
  LE_PURPOSES,
  LE_SERVICES,
  LE_STRUCTURES,
  LE_TRUST_ROLES,
  LE_WEBSITE_STATUS,
  accountLabel,
  capacityNeedsFirm,
  capacityOptions,
  directionActive,
  euAgentApplicable,
  flowPurposes,
  isPublicCompany,
  isTrust,
  leAcctKey,
  leAmountKey,
  leCorpJurKey,
  leCorpPctKey,
  leCountKey,
  leCountriesId,
  leCountriesUnknownKey,
  leCurrKey,
  leCurrLevelKey,
  leFlowPurposeKey,
  leFlowPurposeOtherKey,
  licenceActive,
  licenceImmediate,
  lePersonCountKey,
  lePersonKey,
  lePersonNatId,
  lePurposeKey,
  leRailKey,
  leSvcKey,
  leSvcLevelKey,
  levelLabel,
  ownershipGroup,
  personPrefix,
  railsForCurrency,
  rowCount,
  selectedAccounts,
  selectedCurrencies,
  type LeDirection,
} from "@/lib/questionnaire/legal-entity-bank-config";
import type { CountryPickers, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  step: number;
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onChange: (key: string, value: FieldValue) => void;
  onPickerChange: (id: string, list: string[]) => void;
  fieldErrors?: Record<string, string>;
};

type Errors = Record<string, string> | undefined;

function LevelToggle({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
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

function FieldError({ id, errors }: { id: string; errors: Errors }) {
  const msg = errors?.[id];
  if (!msg) return null;
  return (
    <p className="field-error" id={`${id}-error`} role="alert">
      {msg}
    </p>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--muted)] mt-1">{children}</p>;
}

function TextField({
  id,
  label,
  value,
  onChange,
  errors,
  type = "text",
  placeholder,
  hint,
  multiline,
}: {
  id: string;
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  errors: Errors;
  type?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <label className="field" data-field={id}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={String(value ?? "")} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={String(value ?? "")} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <Hint>{hint}</Hint>}
      <FieldError id={id} errors={errors} />
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  errors,
}: {
  id: string;
  label: string;
  value: unknown;
  options: ReadonlyArray<string | { value: string; label: string }>;
  onChange: (v: string) => void;
  errors: Errors;
}) {
  return (
    <label className="field" data-field={id}>
      <span>{label}</span>
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <FieldError id={id} errors={errors} />
    </label>
  );
}

function RadioList({
  id,
  legend,
  name,
  value,
  options,
  onChange,
  errors,
}: {
  id: string;
  legend: string;
  name: string;
  value: unknown;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
  errors: Errors;
}) {
  return (
    <fieldset className="mb-4" data-field={id}>
      <legend className="field-label">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="checkline">
          <input type="radio" name={name} checked={String(value ?? "") === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
      <FieldError id={id} errors={errors} />
    </fieldset>
  );
}

function YesNo({
  id,
  label,
  value,
  onChange,
  errors,
  options = ["Yes", "No"],
}: {
  id: string;
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  errors: Errors;
  options?: ReadonlyArray<string>;
}) {
  return (
    <RadioList
      id={id}
      legend={label}
      name={id}
      value={value}
      options={options.map((o) => ({ value: o, label: o }))}
      onChange={onChange}
      errors={errors}
    />
  );
}

/* ─── Step 1 · Entity details (LE01) ─────────────────────────────────────── */

function EntityStep({ values, onChange, fieldErrors }: Props) {
  const trust = isTrust(values);
  const type = String(values["entity-type"] ?? "");
  const notIssued = values["registration-notissued"] === true;

  return (
    <>
      <p className="lead mt-6">Tell us about the legal entity.</p>
      <SelectField
        id="entity-type"
        label="Legal structure"
        value={type}
        options={LE_STRUCTURES.map((s) => s.label)}
        onChange={(v) => {
          onChange("entity-type", v);
          if (v !== "Other") onChange("entity-type-other", "");
          if (v !== "Trust") onChange("trust-governing-law", "");
        }}
        errors={fieldErrors}
      />
      {type === "Other" && (
        <TextField
          id="entity-type-other"
          label="Please specify the legal structure"
          value={values["entity-type-other"]}
          onChange={(v) => onChange("entity-type-other", v)}
          errors={fieldErrors}
        />
      )}
      <TextField
        id="company-name"
        label={trust ? "Trust name" : "Registered entity name"}
        value={values["company-name"]}
        onChange={(v) => onChange("company-name", v)}
        errors={fieldErrors}
      />
      <div data-field="incorporation">
        <CountrySearchSelect
          id="incorporation"
          label={trust ? "Country where the trust is established" : "Country / jurisdiction of incorporation"}
          required
          value={String(values.incorporation ?? "")}
          onChange={(v) => onChange("incorporation", v)}
        />
        <FieldError id="incorporation" errors={fieldErrors} />
      </div>
      {trust && (
        <div data-field="trust-governing-law">
          <CountrySearchSelect
            id="trust-governing-law"
            label="Governing-law jurisdiction"
            required
            value={String(values["trust-governing-law"] ?? "")}
            onChange={(v) => onChange("trust-governing-law", v)}
          />
          <FieldError id="trust-governing-law" errors={fieldErrors} />
        </div>
      )}
      {!notIssued && (
        <TextField
          id="registration"
          label={trust ? "Trust registration / reference number, if applicable" : "Registration number or official identifier"}
          value={values.registration}
          onChange={(v) => onChange("registration", v)}
          errors={fieldErrors}
        />
      )}
      <label className="checkline">
        <input
          type="checkbox"
          checked={notIssued}
          onChange={(e) => {
            onChange("registration-notissued", e.target.checked);
            if (e.target.checked) onChange("registration", "");
          }}
        />
        <span>{trust ? "Not applicable — the trust has no registration or reference number" : "No official identifier is issued for this entity"}</span>
      </label>
      {notIssued && !trust && (
        <TextField
          id="registration-exception-reason"
          label="Explain the identifier exception"
          value={values["registration-exception-reason"]}
          onChange={(v) => onChange("registration-exception-reason", v)}
          errors={fieldErrors}
          multiline
        />
      )}
    </>
  );
}

/* ─── Step 2 · Business activity (LE02–LE05) ─────────────────────────────── */

function ActivityStep({ values, onChange, onPickerChange, pickers, fieldErrors }: Props) {
  const trust = isTrust(values);
  const status = String(values["website-status"] ?? "");
  const industry = String(values.industry ?? "");
  const immediate = licenceImmediate(values);
  const licenceFields = licenceActive(values);
  const offices = String(values.offices ?? "");

  return (
    <>
      <RadioList
        id="website-status"
        legend="Website status"
        name="website-status"
        value={status}
        options={LE_WEBSITE_STATUS}
        onChange={(v) => onChange("website-status", v)}
        errors={fieldErrors}
      />
      {status === "available" && (
        <TextField
          id="website"
          label="Website address"
          type="url"
          placeholder="https://"
          value={values.website}
          onChange={(v) => onChange("website", v)}
          errors={fieldErrors}
        />
      )}
      {(status === "under_development" || status === "not_applicable") && (
        <TextField
          id="website-reason"
          label="Brief reason"
          value={values["website-reason"]}
          onChange={(v) => onChange("website-reason", v)}
          errors={fieldErrors}
          multiline
          hint="For example: site launches next quarter, or the entity does not trade online."
        />
      )}

      <SelectField
        id="industry"
        label="Industry category"
        value={industry}
        options={LE_INDUSTRIES}
        onChange={(v) => {
          onChange("industry", v);
          if (v !== "Other") onChange("industry-other", "");
        }}
        errors={fieldErrors}
      />
      {industry === "Other" && (
        <TextField
          id="industry-other"
          label="Please specify your industry"
          value={values["industry-other"]}
          onChange={(v) => onChange("industry-other", v)}
          errors={fieldErrors}
        />
      )}
      <TextField
        id="activity"
        label="Please describe your business activity"
        value={values.activity}
        onChange={(v) => onChange("activity", v)}
        errors={fieldErrors}
        multiline
        hint="What the entity does, who its customers are and how it earns revenue."
      />

      {industry && (
        <section className="panel">
          <h2 className="mt-0">Licensing and authorisation</h2>
          {!immediate && (
            <YesNo
              id="licence"
              label="Does your activity require a licence or authorisation?"
              value={values.licence}
              onChange={(v) => onChange("licence", v)}
              errors={fieldErrors}
              options={LE_LICENCE_ANSWERS}
            />
          )}
          {immediate && (
            <p className="text-sm text-[var(--muted)] mb-3">
              This activity is normally licensed or regulated. Please give the licence details.
            </p>
          )}
          {licenceFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="licence-name"
                label="Licence name / type"
                value={values["licence-name"]}
                onChange={(v) => onChange("licence-name", v)}
                errors={fieldErrors}
              />
              <TextField
                id="licence-reference"
                label="Licence reference"
                value={values["licence-reference"]}
                onChange={(v) => onChange("licence-reference", v)}
                errors={fieldErrors}
              />
              <TextField
                id="licence-authority"
                label="Issuing authority"
                value={values["licence-authority"]}
                onChange={(v) => onChange("licence-authority", v)}
                errors={fieldErrors}
              />
              <div data-field="licence-jurisdiction">
                <CountrySearchSelect
                  id="licence-jurisdiction"
                  label="Licensing jurisdiction"
                  required
                  value={String(values["licence-jurisdiction"] ?? "")}
                  onChange={(v) => onChange("licence-jurisdiction", v)}
                />
                <FieldError id="licence-jurisdiction" errors={fieldErrors} />
              </div>
            </div>
          )}
          {euAgentApplicable(values) && (
            <>
              <YesNo
                id="agent"
                label="Will an EU payment agent be used for this activity?"
                value={values.agent}
                onChange={(v) => onChange("agent", v)}
                errors={fieldErrors}
                options={["Yes", "No", "Not yet confirmed"]}
              />
              <Hint>
                Asked only for gambling / betting and forex / CFD activities where both incorporation and licensing are
                outside the EU.
              </Hint>
            </>
          )}
        </section>
      )}

      <section className="panel">
        <h2 className="mt-0">Offices and staff</h2>
        <RadioList
          id="offices"
          legend={trust ? "Where is the trust administered or operated?" : "Where does the entity have physical offices?"}
          name="offices"
          value={offices}
          options={LE_OFFICE_MODES.map((m) => ({ value: m.value, label: trust ? m.trustLabel : m.label }))}
          onChange={(v) => {
            onChange("offices", v);
            if (v !== "other") onPickerChange("offices-countries", []);
          }}
          errors={fieldErrors}
        />
        {offices === "other" && (
          <div data-field="offices-countries">
            <CountryMultiSelect
              id="offices-countries"
              label={trust ? "Countries where the trust is administered or operated" : "Other operating countries with a physical office"}
              required
              value={pickers["offices-countries"] ?? []}
              onChange={(next) => onPickerChange("offices-countries", next)}
            />
            <FieldError id="offices-countries" errors={fieldErrors} />
          </div>
        )}
        <RadioList
          id="employees"
          legend={trust ? "How many people are employed to administer or operate the trust?" : "How many people does the entity employ?"}
          name="employees"
          value={values.employees}
          options={LE_EMPLOYEE_BANDS.map((b) => ({ value: b, label: b }))}
          onChange={(v) => onChange("employees", v)}
          errors={fieldErrors}
        />
      </section>
    </>
  );
}

/* ─── Step 3 · Account and flows (LE06–LE09, LE21) ───────────────────────── */

function BandSelect({
  id,
  label,
  value,
  bands,
  onChange,
  errors,
}: {
  id: string;
  label: string;
  value: unknown;
  bands: ReadonlyArray<{ id: string; label: string }>;
  onChange: (v: string) => void;
  errors: Errors;
}) {
  return (
    <label className="field" data-field={id}>
      <span>{label}</span>
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {bands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
      <FieldError id={id} errors={errors} />
    </label>
  );
}

function FlowSchedule({
  dir,
  account,
  currencies,
  values,
  pickers,
  onChange,
  onPickerChange,
  fieldErrors,
}: {
  dir: LeDirection;
  account: string;
  currencies: string[];
} & Pick<Props, "values" | "pickers" | "onChange" | "onPickerChange" | "fieldErrors">) {
  const word = dir === "in" ? "Incoming" : "Outgoing";
  const lower = word.toLowerCase();
  const active = directionActive(values, dir, account, currencies);
  const countriesId = leCountriesId(dir, account);
  const unknownKey = leCountriesUnknownKey(dir, account);
  const unknown = values[unknownKey] === true;
  const purposesId = `le-${dir}-purposes:${account}`;
  const otherKey = leFlowPurposeOtherKey(dir, account);

  return (
    <div className="check-block" data-field={`le-${dir}:${account}`}>
      <h4 className="font-semibold mt-3">{word} payments</h4>
      {currencies.map((code) => (
        <div key={`${dir}-${account}-${code}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BandSelect
            id={leCountKey(dir, account, code)}
            label={`${word} transactions per month (${code})`}
            value={values[leCountKey(dir, account, code)]}
            bands={LE_COUNT_BANDS}
            onChange={(v) => onChange(leCountKey(dir, account, code), v)}
            errors={fieldErrors}
          />
          <BandSelect
            id={leAmountKey(dir, account, code)}
            label={`${word} total amount per month (${code})`}
            value={values[leAmountKey(dir, account, code)]}
            bands={LE_AMOUNT_BANDS}
            onChange={(v) => onChange(leAmountKey(dir, account, code), v)}
            errors={fieldErrors}
          />
        </div>
      ))}
      {!active ? (
        <p className="text-sm text-[var(--muted)]">No {lower} activity expected — countries and purposes are not needed.</p>
      ) : (
        <>
          <div data-field={countriesId}>
            {!unknown && (
              <CountryMultiSelect
                id={countriesId}
                label={`Countries ${dir === "in" ? "payments are received from" : "payments are sent to"}`}
                required
                value={pickers[countriesId] ?? []}
                onChange={(next) => onPickerChange(countriesId, next)}
              />
            )}
            <label className="checkline">
              <input
                type="checkbox"
                checked={unknown}
                onChange={(e) => {
                  onChange(unknownKey, e.target.checked);
                  if (e.target.checked) onPickerChange(countriesId, []);
                }}
              />
              <span>Countries not yet known</span>
            </label>
            <FieldError id={countriesId} errors={fieldErrors} />
          </div>
          <p className="field-label mt-3">Purpose of {lower} payments</p>
          <div className="checks-grid" data-field={purposesId}>
            {flowPurposes(dir, account).map((p) => (
              <label key={p.id} className="checkline">
                <input
                  type="checkbox"
                  checked={values[leFlowPurposeKey(dir, account, p.id)] === true}
                  onChange={(e) => onChange(leFlowPurposeKey(dir, account, p.id), e.target.checked)}
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
          <FieldError id={purposesId} errors={fieldErrors} />
          {values[leFlowPurposeKey(dir, account, "other")] === true && (
            <TextField
              id={otherKey}
              label="Please specify"
              value={values[otherKey]}
              onChange={(v) => onChange(otherKey, v)}
              errors={fieldErrors}
            />
          )}
        </>
      )}
    </div>
  );
}

function AccountsStep(props: Props) {
  const { values, pickers, onChange, onPickerChange, fieldErrors } = props;
  const accounts = selectedAccounts(values);
  const currencies = selectedCurrencies(values);
  const both = accounts.length > 1;

  return (
    <>
      <p className="lead mt-6">What kind of account do you need, and how will it be used?</p>

      <p className="field-label">Which account types do you need?</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        Select at least one. A dedicated client-funds account is only collected when you choose it here.
      </p>
      <div className="service-card-grid" data-field="le-accounts">
        {LE_ACCOUNTS.map((a) => {
          const on = values[leAcctKey(a.id)] === true;
          return (
            <div key={a.id} className={`service-card ${on ? "service-card-on" : ""}`}>
              <label className="checkline">
                <input type="checkbox" checked={on} onChange={(e) => onChange(leAcctKey(a.id), e.target.checked)} />
                <span>{a.label}</span>
              </label>
            </div>
          );
        })}
      </div>
      <FieldError id="le-accounts" errors={fieldErrors} />

      <p className="field-label mt-6">Why are you opening this account?</p>
      <div className="checks-grid" data-field="le-purposes">
        {LE_PURPOSES.map((p) => (
          <label key={p.id} className="checkline service-card">
            <input
              type="checkbox"
              checked={values[lePurposeKey(p.id)] === true}
              onChange={(e) => onChange(lePurposeKey(p.id), e.target.checked)}
            />
            <span>{p.label}</span>
          </label>
        ))}
      </div>
      {values[lePurposeKey("facility")] === true && (
        <TextField
          id="le-facility-text"
          label="Describe the banking facility you need"
          value={values["le-facility-text"]}
          onChange={(v) => onChange("le-facility-text", v)}
          errors={fieldErrors}
        />
      )}
      {values[lePurposeKey("other")] === true && (
        <TextField
          id="le-purpose-other"
          label="Please explain the other purpose"
          value={values["le-purpose-other"]}
          onChange={(v) => onChange("le-purpose-other", v)}
          errors={fieldErrors}
        />
      )}

      <p className="field-label mt-6">Additional services</p>
      <p className="text-sm text-[var(--muted)] mb-3">{LE_PRIORITY_EXPLANATION}</p>
      <div className="service-card-grid">
        {LE_SERVICES.map((s) => {
          const on = values[leSvcKey(s.id)] === true;
          return (
            <div key={s.id} className={`service-card ${on ? "service-card-on" : ""}`}>
              <label className="checkline">
                <input type="checkbox" checked={on} onChange={(e) => onChange(leSvcKey(s.id), e.target.checked)} />
                <span>{s.label}</span>
              </label>
              {on && (
                <LevelToggle
                  name={`le-svc-${s.id}`}
                  value={String(values[leSvcLevelKey(s.id)] ?? "preferred")}
                  onChange={(v) => onChange(leSvcLevelKey(s.id), v)}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="field-label mt-6">Which currencies do you need?</p>
      <p className="text-sm text-[var(--muted)] mb-3">
        Select at least one. {both ? "Currencies and payment methods apply to all selected accounts. " : ""}
        {LE_PRIORITY_EXPLANATION}
      </p>
      {(values["Swiss franc (CHF)"] === true ||
        values["bank-chf"] === true ||
        String(values.currencies ?? "").includes("CHF") ||
        String(values["bank-other-text"] ?? "").toUpperCase().includes("CHF")) && (
        <div className="notice" data-field="le-chf-reconfirm" role="status">
          This assessment previously recorded Swiss franc (CHF). CHF is no longer a primary currency choice.
          Please reconfirm using EUR, GBP or USD. Historical CHF amounts are kept as recorded and are not
          remapped to EUR.
        </div>
      )}
      <div className="checks-grid" data-field="le-currencies">
        {LE_CURRENCIES.map((code) => {
          const on = values[leCurrKey(code)] === true;
          const level = String(values[leCurrLevelKey(code)] ?? "preferred");
          return (
            <div key={code} className="check-block">
              <label className="checkline">
                <input type="checkbox" checked={on} onChange={(e) => onChange(leCurrKey(code), e.target.checked)} />
                <span>{code}</span>
              </label>
              {on && (
                <>
                  <LevelToggle name={`le-curr-${code}`} value={level} onChange={(v) => onChange(leCurrLevelKey(code), v)} />
                  <p className="text-sm text-[var(--muted)] mt-2">
                    Payment methods for {code}
                    {both ? " — Applies to all selected accounts" : ""}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    Methods inherit the currency priority: {levelLabel(level)}.
                  </p>
                  <div className="checks-grid">
                    {railsForCurrency(code).map((r) => (
                      <label key={r.id} className="checkline">
                        <input
                          type="checkbox"
                          checked={values[leRailKey(r.id)] === true}
                          onChange={(e) => onChange(leRailKey(r.id), e.target.checked)}
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
      <FieldError id="le-currencies" errors={fieldErrors} />

      <h2 className="text-lg font-semibold mt-6">Expected monthly activity</h2>
      {both && (
        <p className="text-sm text-[var(--muted)]">
          Separate schedules are collected for each selected account. Estimate each account on its own.
        </p>
      )}
      {!accounts.length && <p className="text-sm text-[var(--muted)]">Select an account type above to enter monthly estimates.</p>}
      {accounts.length > 0 && !currencies.length && (
        <p className="text-sm text-[var(--muted)]">Select at least one currency above to enter monthly estimates.</p>
      )}
      {currencies.length > 0 &&
        accounts.map((account) => (
          <section key={account} className="panel" data-field={`le-schedule:${account}`}>
            <h3 className="mt-0">{accountLabel(account)}</h3>
            <FlowSchedule
              dir="in"
              account={account}
              currencies={currencies}
              values={values}
              pickers={pickers}
              onChange={onChange}
              onPickerChange={onPickerChange}
              fieldErrors={fieldErrors}
            />
            <FlowSchedule
              dir="out"
              account={account}
              currencies={currencies}
              values={values}
              pickers={pickers}
              onChange={onChange}
              onPickerChange={onPickerChange}
              fieldErrors={fieldErrors}
            />
          </section>
        ))}
    </>
  );
}

/* ─── Step 39 · Existing banking (LE10) ──────────────────────────────────── */

function ExistingBankingStep({ values, onChange, fieldErrors }: Props) {
  const state = String(values["existing-banking"] ?? "");
  const declared = state === "present" || state === "closed";
  return (
    <>
      <p className="lead mt-6">Does the entity already bank with a business account?</p>
      <RadioList
        id="existing-banking"
        legend="Existing business banking"
        name="existing-banking"
        value={state}
        options={LE_EXISTING_BANKING}
        onChange={(v) => onChange("existing-banking", v)}
        errors={fieldErrors}
      />
      <Hint>A closed account is recorded separately and is never treated as an open relationship.</Hint>
      {declared && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <TextField
            id="existing-bank-name"
            label={state === "closed" ? "Bank name (closed account)" : "Bank name"}
            value={values["existing-bank-name"]}
            onChange={(v) => onChange("existing-bank-name", v)}
            errors={fieldErrors}
          />
          <div data-field="existing-bank-country">
            <CountrySearchSelect
              id="existing-bank-country"
              label={state === "closed" ? "Bank country (closed account)" : "Bank country"}
              value={String(values["existing-bank-country"] ?? "")}
              onChange={(v) => onChange("existing-bank-country", v)}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Step 4 · Ownership and control (LE11–LE16) ─────────────────────────── */

function PersonRows({
  prefix,
  values,
  pickers,
  onChange,
  onPickerChange,
  fieldErrors,
  percent,
  roles,
  pctLabel,
  noun,
  countError,
}: {
  prefix: "bo" | "partner" | "role" | "trust";
  percent: boolean;
  roles?: ReadonlyArray<string>;
  pctLabel?: string;
  noun: string;
  countError?: string;
} & Pick<Props, "values" | "pickers" | "onChange" | "onPickerChange" | "fieldErrors">) {
  const countKey = lePersonCountKey(prefix);
  const count = rowCount(values, countKey);

  function add() {
    if (count >= LE_MAX_ROWS) return;
    onChange(countKey, String(count + 1));
  }

  function removeLast() {
    if (count < 1) return;
    const i = count - 1;
    onChange(lePersonKey(prefix, "role", i), "");
    onChange(lePersonKey(prefix, "pct", i), "");
    onChange(lePersonKey(prefix, "res", i), "");
    onChange(lePersonKey(prefix, "desc", i), "");
    onPickerChange(lePersonNatId(prefix, i), []);
    onChange(countKey, String(i));
  }

  return (
    <div data-field={countKey}>
      {Array.from({ length: count }, (_, i) => {
        const role = String(values[lePersonKey(prefix, "role", i)] ?? "");
        const nats = pickers[lePersonNatId(prefix, i)] ?? [];
        const residence = String(values[lePersonKey(prefix, "res", i)] ?? "");
        const singleNat = nats.length === 1 ? nats[0] : "";
        const descOnly = role === "Beneficiary class" || role === "Other control";
        return (
          <section key={`${prefix}-${i}`} className="panel">
            <h4 className="font-semibold mt-0">
              {noun} {i + 1}
            </h4>
            {roles && (
              <SelectField
                id={lePersonKey(prefix, "role", i)}
                label="Role"
                value={role}
                options={roles}
                onChange={(v) => onChange(lePersonKey(prefix, "role", i), v)}
                errors={fieldErrors}
              />
            )}
            {percent && (
              <label className="field" data-field={lePersonKey(prefix, "pct", i)}>
                <span>{pctLabel ?? "Ownership %"}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={String(values[lePersonKey(prefix, "pct", i)] ?? "")}
                  onChange={(e) => onChange(lePersonKey(prefix, "pct", i), e.target.value)}
                />
                <FieldError id={lePersonKey(prefix, "pct", i)} errors={fieldErrors} />
              </label>
            )}
            {descOnly ? (
              <TextField
                id={lePersonKey(prefix, "desc", i)}
                label={role === "Beneficiary class" ? "Describe the class of beneficiaries" : "Describe the control or role"}
                value={values[lePersonKey(prefix, "desc", i)]}
                onChange={(v) => onChange(lePersonKey(prefix, "desc", i), v)}
                errors={fieldErrors}
                multiline
              />
            ) : (
              <>
                <div data-field={lePersonNatId(prefix, i)}>
                  <CountryMultiSelect
                    id={lePersonNatId(prefix, i)}
                    label="Nationality / nationalities"
                    required
                    value={nats}
                    onChange={(next) => onPickerChange(lePersonNatId(prefix, i), next)}
                  />
                  <FieldError id={lePersonNatId(prefix, i)} errors={fieldErrors} />
                </div>
                {singleNat && (
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={residence === singleNat}
                      onChange={(e) => onChange(lePersonKey(prefix, "res", i), e.target.checked ? singleNat : "")}
                    />
                    <span>Also resident in {singleNat}.</span>
                  </label>
                )}
                <div data-field={lePersonKey(prefix, "res", i)}>
                  <CountrySearchSelect
                    id={lePersonKey(prefix, "res", i)}
                    label="Country of residence"
                    required
                    value={residence}
                    onChange={(v) => onChange(lePersonKey(prefix, "res", i), v)}
                  />
                  <FieldError id={lePersonKey(prefix, "res", i)} errors={fieldErrors} />
                </div>
              </>
            )}
          </section>
        );
      })}
      <div className="flex flex-wrap gap-3 items-center mb-2">
        <button type="button" className="btn" onClick={add} disabled={count >= LE_MAX_ROWS}>
          Add {noun.toLowerCase()}
        </button>
        {count > 0 && (
          <button type="button" className="btn" onClick={removeLast}>
            Remove last
          </button>
        )}
      </div>
      <FieldError id={countKey} errors={fieldErrors} />
      {countError && <p className="field-error">{countError}</p>}
    </div>
  );
}

function CoverageNote({ prefix, values, fieldErrors, noun }: { prefix: string; values: QuestionnaireValues; fieldErrors: Errors; noun: string }) {
  const count = rowCount(values, lePersonCountKey(prefix));
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const n = Number(values[lePersonKey(prefix, "pct", i)]);
    if (Number.isFinite(n) && n > 0) total += n;
  }
  return (
    <div data-field={`le-${prefix}-coverage`}>
      <p className="text-sm text-[var(--muted)]">
        {noun} declared so far: {Math.round(total * 100) / 100}% — declare at least 75% and no more than 100%.
      </p>
      <FieldError id={`le-${prefix}-coverage`} errors={fieldErrors} />
    </div>
  );
}

function CorporateShareholders({ values, onChange, fieldErrors }: Pick<Props, "values" | "onChange" | "fieldErrors">) {
  const count = rowCount(values, "le-corp-count");
  return (
    <div data-field="le-corp-count">
      {Array.from({ length: count }, (_, i) => (
        <section key={`corp-${i}`} className="panel">
          <h4 className="font-semibold mt-0">Corporate shareholder {i + 1}</h4>
          <div data-field={leCorpJurKey(i)}>
            <CountrySearchSelect
              id={leCorpJurKey(i)}
              label="Jurisdiction of incorporation"
              required
              value={String(values[leCorpJurKey(i)] ?? "")}
              onChange={(v) => onChange(leCorpJurKey(i), v)}
            />
            <FieldError id={leCorpJurKey(i)} errors={fieldErrors} />
          </div>
          <label className="field" data-field={leCorpPctKey(i)}>
            <span>Shareholding %</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={String(values[leCorpPctKey(i)] ?? "")}
              onChange={(e) => onChange(leCorpPctKey(i), e.target.value)}
            />
            <FieldError id={leCorpPctKey(i)} errors={fieldErrors} />
          </label>
        </section>
      ))}
      <div className="flex flex-wrap gap-3 items-center mb-2">
        <button
          type="button"
          className="btn"
          disabled={count >= LE_MAX_ROWS}
          onClick={() => onChange("le-corp-count", String(count + 1))}
        >
          Add corporate shareholder
        </button>
        {count > 0 && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              const i = count - 1;
              onChange(leCorpJurKey(i), "");
              onChange(leCorpPctKey(i), "");
              onChange("le-corp-count", String(i));
            }}
          >
            Remove last
          </button>
        )}
      </div>
      <Hint>Entity names are not collected — only jurisdiction and shareholding.</Hint>
      <FieldError id="le-corp-count" errors={fieldErrors} />
    </div>
  );
}

function OwnershipStep(props: Props) {
  const { values, onChange, fieldErrors } = props;
  const group = ownershipGroup(values);
  const prefix = personPrefix(group);

  return (
    <>
      {!group && <p className="notice">Choose your legal structure on the Entity details step to see the right ownership questions.</p>}

      {group === "company" && (
        <>
          <p className="lead mt-6">Ownership — shareholders and beneficial owners.</p>
          {isPublicCompany(values) && (
            <>
              <YesNo
                id="plc-listed"
                label="Is the company listed on a stock exchange?"
                value={values["plc-listed"]}
                onChange={(v) => onChange("plc-listed", v)}
                errors={fieldErrors}
              />
              {values["plc-listed"] === "Yes" && (
                <TextField
                  id="plc-exchange"
                  label="Stock exchange and ticker / listing identifier"
                  value={values["plc-exchange"]}
                  onChange={(v) => onChange("plc-exchange", v)}
                  errors={fieldErrors}
                />
              )}
            </>
          )}
          <YesNo
            id="corporate"
            label="Are any shareholders legal entities?"
            value={values.corporate}
            onChange={(v) => {
              onChange("corporate", v);
              if (v !== "Yes") onChange("le-corp-count", "");
            }}
            errors={fieldErrors}
          />
          {values.corporate === "Yes" && <CorporateShareholders values={values} onChange={onChange} fieldErrors={fieldErrors} />}
          <h3 className="font-semibold mt-6">Beneficial owners</h3>
          <Hint>Personal names are not collected. Declare ownership that adds up to at least 75% and no more than 100%.</Hint>
          <PersonRows {...props} prefix="bo" percent pctLabel="Beneficial ownership %" noun="Beneficial owner" />
          <CoverageNote prefix="bo" values={values} fieldErrors={fieldErrors} noun="Beneficial ownership" />
          <TextField
            id="ownership-clarification"
            label="Ownership or control clarification (optional)"
            value={values["ownership-clarification"]}
            onChange={(v) => onChange("ownership-clarification", v)}
            errors={fieldErrors}
            multiline
          />
        </>
      )}

      {group === "partnership" && (
        <>
          <p className="lead mt-6">Ownership — partners and interests.</p>
          <RadioList
            id="le-partner-route"
            legend="How would you like to describe the partners?"
            name="le-partner-route"
            value={values["le-partner-route"]}
            options={LE_PARTNER_ROUTES}
            onChange={(v) => onChange("le-partner-route", v)}
            errors={fieldErrors}
          />
          {values["le-partner-route"] === "percentage" && (
            <>
              <PersonRows {...props} prefix="partner" percent pctLabel="Partner interest %" noun="Partner" />
              <CoverageNote prefix="partner" values={values} fieldErrors={fieldErrors} noun="Partner interests" />
            </>
          )}
          {values["le-partner-route"] === "control" && (
            <TextField
              id="nonshare-structure"
              label="Who controls the partnership?"
              value={values["nonshare-structure"]}
              onChange={(v) => onChange("nonshare-structure", v)}
              errors={fieldErrors}
              multiline
            />
          )}
        </>
      )}

      {group === "nonshare" && (
        <>
          <p className="lead mt-6">Control — roles and governance.</p>
          <Hint>This structure has no shareholders, so no ownership percentage is collected.</Hint>
          <PersonRows {...props} prefix="role" percent={false} roles={LE_NONSHARE_ROLES} noun="Role holder" />
          <TextField
            id="nonshare-structure"
            label="Who controls or governs this entity?"
            value={values["nonshare-structure"]}
            onChange={(v) => onChange("nonshare-structure", v)}
            errors={fieldErrors}
            multiline
          />
        </>
      )}

      {group === "trust" && (
        <>
          <p className="lead mt-6">Control — settlor, trustees and beneficiaries.</p>
          <Hint>No share percentages are collected for trusts. Add at least a Settlor, a Trustee and a Beneficiary or class.</Hint>
          <PersonRows {...props} prefix={prefix} percent={false} roles={LE_TRUST_ROLES} noun="Trust party" />
          <YesNo
            id="le-trust-protector"
            label="Does the trust have a protector?"
            value={values["le-trust-protector"]}
            onChange={(v) => onChange("le-trust-protector", v)}
            errors={fieldErrors}
          />
        </>
      )}

      <section className="panel">
        <h2 className="mt-0">Group membership</h2>
        <YesNo
          id="group"
          label="Is the entity part of a group?"
          value={values.group}
          onChange={(v) => {
            onChange("group", v);
            if (v !== "Yes") onChange("group-name", "");
          }}
          errors={fieldErrors}
        />
        {values.group === "Yes" && (
          <TextField
            id="group-name"
            label="Group name (optional)"
            value={values["group-name"]}
            onChange={(v) => onChange("group-name", v)}
            errors={fieldErrors}
          />
        )}
      </section>
    </>
  );
}

/* ─── Step 5 · Contact (LE17) — onboarding panel is rendered by the wizard ─ */

function ContactStep({ values, onChange, fieldErrors }: Props) {
  const group = ownershipGroup(values);
  const role = String(values["representative-role"] ?? "");
  return (
    <>
      <p className="lead mt-6">Who should we contact about this assessment?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          id="contact-name"
          label="Contact name"
          value={values["contact-name"]}
          onChange={(v) => onChange("contact-name", v)}
          errors={fieldErrors}
        />
        <TextField
          id="contact-email"
          label="Contact email"
          type="email"
          value={values["contact-email"]}
          onChange={(v) => onChange("contact-email", v)}
          errors={fieldErrors}
        />
      </div>
      <TextField
        id="contact-phone"
        label="Phone number (optional)"
        type="tel"
        value={values["contact-phone"]}
        onChange={(v) => onChange("contact-phone", v)}
        errors={fieldErrors}
      />
      <SelectField
        id="representative-role"
        label="In what capacity are you applying?"
        value={role}
        options={capacityOptions(group)}
        onChange={(v) => onChange("representative-role", v)}
        errors={fieldErrors}
      />
      {role && capacityNeedsFirm(role) && (
        <TextField
          id="representative-firm"
          label="Firm name and your role"
          value={values["representative-firm"]}
          onChange={(v) => onChange("representative-firm", v)}
          errors={fieldErrors}
        />
      )}
      <div data-field="representative-authority">
        <label className="checkline">
          <input
            type="checkbox"
            checked={values["representative-authority"] === true}
            onChange={(e) => onChange("representative-authority", e.target.checked)}
          />
          <span>I am authorised to submit this request and provide information on behalf of this legal entity.</span>
        </label>
        <FieldError id="representative-authority" errors={fieldErrors} />
      </div>
    </>
  );
}

export function LegalEntityBankSteps(props: Props) {
  switch (props.step) {
    case 1:
      return <EntityStep {...props} />;
    case 2:
      return <ActivityStep {...props} />;
    case 3:
      return <AccountsStep {...props} />;
    case 39:
      return <ExistingBankingStep {...props} />;
    case 4:
      return <OwnershipStep {...props} />;
    case 5:
      return <ContactStep {...props} />;
    default:
      return null;
  }
}
