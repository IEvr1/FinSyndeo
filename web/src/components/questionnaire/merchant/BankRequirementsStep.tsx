"use client";

import { LE_PURPOSES } from "@/lib/questionnaire/legal-entity-bank-config";
import {
  MERCHANT_BANK_ACCOUNT_TYPES,
  MERCHANT_BANK_AMOUNT_BANDS,
  MERCHANT_BANK_COUNT_BANDS,
  MERCHANT_BANK_CURRENCIES,
  MERCHANT_SETTLEMENT_CURRENCIES,
  bankAcctKey,
  bankCurrKey,
  bankCurrLevelKey,
  bankInAmountKey,
  bankInCountKey,
  bankOutAmountKey,
  bankOutCountKey,
  bankRailKey,
  bankRailsForCurrency,
  settlementCurrencyKey,
} from "@/lib/questionnaire/merchant-config";
import type { FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  values: QuestionnaireValues;
  onChange: (key: string, value: FieldValue) => void;
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

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes" || v === "on";
}

function purposeKey(id: string) {
  return `bank-purpose:${id}`;
}

export function BankRequirementsStep({ values, onChange, fieldErrors }: Props) {
  const selectedAccounts = MERCHANT_BANK_ACCOUNT_TYPES.filter((a) => bool(values[bankAcctKey(a.id)]));
  const selectedCurrencies = MERCHANT_BANK_CURRENCIES.filter((c) => bool(values[bankCurrKey(c)]));
  const settlementCurrencies = MERCHANT_SETTLEMENT_CURRENCIES.filter(
    (c) => bool(values[settlementCurrencyKey(c)]) || bool(values[`settle-curr:${c}`])
  );

  return (
    <>
      <p className="lead">Bank account requirements</p>
      <p className="hint mb-3">
        Combined merchant + bank account scope. Dedicated client-funds is never selected automatically.
      </p>

      {settlementCurrencies.length > 0 && (
        <p className="hint mb-3">
          Requested settlement currencies (for confirmation): {settlementCurrencies.join(", ")}
        </p>
      )}

      <div className="panel mb-4" data-field={bankAcctKey("operating")}>
        <p className="field-label">Account types</p>
        {MERCHANT_BANK_ACCOUNT_TYPES.map((a) => (
          <label key={a.id} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="checkbox"
              checked={bool(values[bankAcctKey(a.id)])}
              onChange={(e) => onChange(bankAcctKey(a.id), e.target.checked)}
            />
            <span>{a.label}</span>
          </label>
        ))}
        <FieldError id={bankAcctKey("operating")} errors={fieldErrors} />
      </div>

      <div className="panel mb-4">
        <p className="field-label">Purpose of the bank account</p>
        {LE_PURPOSES.map((p) => (
          <label key={p.id} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="checkbox"
              checked={bool(values[purposeKey(p.id)])}
              onChange={(e) => onChange(purposeKey(p.id), e.target.checked)}
            />
            <span>{p.label}</span>
          </label>
        ))}
        {bool(values[purposeKey("other")]) && (
          <label className="field" data-field="bank-purpose-other">
            <span>Please specify</span>
            <input
              value={String(values["bank-purpose-other"] ?? "")}
              onChange={(e) => onChange("bank-purpose-other", e.target.value)}
            />
          </label>
        )}
      </div>

      <div className="panel mb-4" data-field={bankCurrKey("EUR")}>
        <p className="field-label">Account currencies</p>
        {MERCHANT_BANK_CURRENCIES.map((c) => {
          const on = bool(values[bankCurrKey(c)]);
          return (
            <div key={c} className={`service-card ${on ? "service-card-on" : ""}`} style={{ marginBottom: "0.75rem" }}>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    onChange(bankCurrKey(c), e.target.checked);
                    if (!e.target.checked) onChange(bankCurrLevelKey(c), "");
                    else if (!values[bankCurrLevelKey(c)]) onChange(bankCurrLevelKey(c), "preferred");
                  }}
                />
                <span>{c}</span>
              </label>
              {on && (
                <>
                  <LevelToggle
                    name={`bank-curr-level-${c}`}
                    value={String(values[bankCurrLevelKey(c)] ?? "preferred")}
                    onChange={(v) => onChange(bankCurrLevelKey(c), v)}
                  />
                  <FieldError id={bankCurrLevelKey(c)} errors={fieldErrors} />
                </>
              )}
            </div>
          );
        })}
        <FieldError id={bankCurrKey("EUR")} errors={fieldErrors} />
      </div>

      {selectedCurrencies.length > 0 && (
        <div className="panel mb-4">
          <p className="field-label">Preferred payment rails</p>
          <p className="hint mb-3">Optional. Applies to all selected accounts.</p>
          {selectedCurrencies.map((code) => (
            <div key={code} className="mb-3">
              <p className="field-label">{code}</p>
              {bankRailsForCurrency(code).map((r) => (
                <label key={r.id} className="checkline" style={{ marginBottom: "0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={bool(values[bankRailKey(r.id)])}
                    onChange={(e) => onChange(bankRailKey(r.id), e.target.checked)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {selectedAccounts.map((account) =>
        selectedCurrencies.map((code) => (
          <div key={`${account.id}-${code}`} className="panel mb-4">
            <h3 className="mt-0">
              {account.label} · {code}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="field" data-field={bankInCountKey(account.id, code)}>
                <span>Incoming — monthly transaction count</span>
                <select
                  value={String(values[bankInCountKey(account.id, code)] ?? "")}
                  onChange={(e) => onChange(bankInCountKey(account.id, code), e.target.value)}
                >
                  <option value="">Select…</option>
                  {MERCHANT_BANK_COUNT_BANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" data-field={bankInAmountKey(account.id, code)}>
                <span>Incoming — monthly amount</span>
                <select
                  value={String(values[bankInAmountKey(account.id, code)] ?? "")}
                  onChange={(e) => onChange(bankInAmountKey(account.id, code), e.target.value)}
                >
                  <option value="">Select…</option>
                  {MERCHANT_BANK_AMOUNT_BANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" data-field={bankOutCountKey(account.id, code)}>
                <span>Outgoing — monthly transaction count</span>
                <select
                  value={String(values[bankOutCountKey(account.id, code)] ?? "")}
                  onChange={(e) => onChange(bankOutCountKey(account.id, code), e.target.value)}
                >
                  <option value="">Select…</option>
                  {MERCHANT_BANK_COUNT_BANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" data-field={bankOutAmountKey(account.id, code)}>
                <span>Outgoing — monthly amount</span>
                <select
                  value={String(values[bankOutAmountKey(account.id, code)] ?? "")}
                  onChange={(e) => onChange(bankOutAmountKey(account.id, code), e.target.value)}
                >
                  <option value="">Select…</option>
                  {MERCHANT_BANK_AMOUNT_BANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <FieldError id={bankInCountKey(account.id, code)} errors={fieldErrors} />
            <FieldError id={bankInAmountKey(account.id, code)} errors={fieldErrors} />
            <FieldError id={bankOutCountKey(account.id, code)} errors={fieldErrors} />
            <FieldError id={bankOutAmountKey(account.id, code)} errors={fieldErrors} />
          </div>
        ))
      )}
    </>
  );
}
