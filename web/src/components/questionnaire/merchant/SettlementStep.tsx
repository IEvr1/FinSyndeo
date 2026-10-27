"use client";

import {
  MERCHANT_BANK_ASSIST_INCLUDED,
  MERCHANT_BANK_ASSIST_LABEL,
  MERCHANT_BANK_ASSIST_REMOVE,
  MERCHANT_FIND_BANK_KEY,
  MERCHANT_RECEIVING_ACCOUNT_ANSWERS,
  MERCHANT_SETTLEMENT_CURRENCIES,
  MERCHANT_SETTLEMENT_OWN_NAME_ACK,
  MERCHANT_SETTLEMENT_TYPE,
  receivingRailsForCurrency,
  settlementCurrencyKey,
  settlementTypeKey,
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

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes" || v === "on";
}

function settleRailKey(railId: string) {
  return `merchant-receive-rail:${railId}`;
}

export function SettlementStep({ values, onChange, fieldErrors }: Props) {
  const settlementType = String(
    values[settlementTypeKey()] || values["settlement-type"] || values.settlement || ""
  );
  const needsFiat = settlementType === "bank" || settlementType === "both";
  const needsCrypto = settlementType === "crypto" || settlementType === "both";
  const receiving = String(values["merchant-receiving-account"] || values["receiving-account"] || "");
  const accountType = String(values["account-type"] ?? "");
  const findBank = String(values[MERCHANT_FIND_BANK_KEY] ?? "");
  const bankEntry = String(values["bank-entry"] ?? "");
  const bankIncluded =
    accountType === "both" || findBank === "Yes" || bool(values[MERCHANT_FIND_BANK_KEY]);
  const fromStart = accountType === "both" && (bankEntry === "start" || bankEntry === "");

  const selectedCurrencies = MERCHANT_SETTLEMENT_CURRENCIES.filter(
    (c) => bool(values[settlementCurrencyKey(c)]) || bool(values[`settle-curr:${c}`])
  );

  function addBankRequest() {
    onChange(MERCHANT_FIND_BANK_KEY, "Yes");
    onChange("account-type", "both");
    if (bankEntry !== "start") onChange("bank-entry", "settlement");
  }

  function removeBankRequest() {
    onChange(MERCHANT_FIND_BANK_KEY, "No");
    onChange("account-type", "merchant");
    // Keep provenance so start-vs-settlement can be inferred later if needed
  }

  return (
    <>
      <p className="lead">Settlement</p>

      <fieldset className="field" data-field={settlementTypeKey()}>
        <legend className="field-label">Settlement type</legend>
        {MERCHANT_SETTLEMENT_TYPE.map((t) => (
          <label key={t.value} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="radio"
              name={settlementTypeKey()}
              checked={settlementType === t.value}
              onChange={() => {
                onChange(settlementTypeKey(), t.value);
                onChange("settlement-type", t.value);
              }}
            />
            <span>{t.label}</span>
          </label>
        ))}
      </fieldset>
      <FieldError id={settlementTypeKey()} errors={fieldErrors} />

      {needsFiat && (
        <div className="panel mb-4" data-field={settlementCurrencyKey("EUR")}>
          <p className="field-label">Settlement currencies (fiat)</p>
          {MERCHANT_SETTLEMENT_CURRENCIES.map((c) => (
            <label key={c} className="checkline" style={{ marginBottom: "0.5rem" }}>
              <input
                type="checkbox"
                checked={bool(values[settlementCurrencyKey(c)]) || bool(values[`settle-curr:${c}`])}
                onChange={(e) => {
                  onChange(settlementCurrencyKey(c), e.target.checked);
                  onChange(`settle-curr:${c}`, e.target.checked);
                }}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      )}

      {needsCrypto && (
        <div className="panel mb-4">
          <label className="field" data-field="merchant-settle-crypto-asset">
            <span>Crypto settlement asset</span>
            <input
              value={String(values["merchant-settle-crypto-asset"] ?? "")}
              onChange={(e) => onChange("merchant-settle-crypto-asset", e.target.value)}
              placeholder="e.g. USDT, USDC, BTC"
            />
          </label>
          <label className="field" data-field="merchant-settle-crypto-network">
            <span>Network</span>
            <input
              value={String(values["merchant-settle-crypto-network"] ?? "")}
              onChange={(e) => onChange("merchant-settle-crypto-network", e.target.value)}
              placeholder="e.g. Ethereum, Tron"
            />
          </label>
          <p className="hint">Crypto settlement support is not confirmed for all providers.</p>
        </div>
      )}

      <label className="checkline" data-field="merchant-settlement-own-name" style={{ marginBottom: "1rem" }}>
        <input
          type="checkbox"
          checked={
            values["merchant-settlement-own-name"] === true ||
            values["settlement-own-name-ack"] === true ||
            values["settlement-own-name"] === true
          }
          onChange={(e) => {
            onChange("merchant-settlement-own-name", e.target.checked);
            onChange("settlement-own-name-ack", e.target.checked);
          }}
        />
        <span>{MERCHANT_SETTLEMENT_OWN_NAME_ACK}</span>
      </label>
      <FieldError id="merchant-settlement-own-name" errors={fieldErrors} />

      {needsFiat && (
        <>
          <fieldset className="field" data-field="merchant-receiving-account">
            <legend className="field-label">Do you have a suitable receiving account in the entity’s own name?</legend>
            {MERCHANT_RECEIVING_ACCOUNT_ANSWERS.map((a) => (
              <label key={a.value} className="checkline" style={{ marginBottom: "0.5rem" }}>
                <input
                  type="radio"
                  name="merchant-receiving-account"
                  checked={receiving === a.value}
                  onChange={() => {
                    onChange("merchant-receiving-account", a.value);
                    onChange("receiving-account", a.value);
                  }}
                />
                <span>{a.label}</span>
              </label>
            ))}
          </fieldset>
          <FieldError id="merchant-receiving-account" errors={fieldErrors} />

          {receiving === "Yes" && (
            <div className="panel mb-4" data-field="merchant-receive-rails">
              <p className="field-label">Receiving rails</p>
              <p className="hint mb-3">
                Select rails for each settlement currency, or mark Not sure (exclusive per currency).
              </p>
              {(selectedCurrencies.length ? selectedCurrencies : [...MERCHANT_SETTLEMENT_CURRENCIES]).map(
                (code) => {
                  const rails = receivingRailsForCurrency(code);
                  const notSure = bool(values[`merchant-receive-not-sure:${code}`]);
                  return (
                    <div key={code} className="nested-panel panel mb-3" data-field={`merchant-receive-rails:${code}`}>
                      <p className="field-label">{code}</p>
                      {rails.map((r) => (
                        <label key={r.id} className="checkline" style={{ marginBottom: "0.4rem" }}>
                          <input
                            type="checkbox"
                            checked={!notSure && bool(values[settleRailKey(r.id)])}
                            disabled={notSure}
                            onChange={(e) => onChange(settleRailKey(r.id), e.target.checked)}
                          />
                          <span>{r.label}</span>
                        </label>
                      ))}
                      <label className="checkline" style={{ marginTop: "0.5rem" }}>
                        <input
                          type="checkbox"
                          checked={notSure}
                          onChange={(e) => {
                            const on = e.target.checked;
                            onChange(`merchant-receive-not-sure:${code}`, on);
                            if (on) {
                              rails.forEach((r) => onChange(settleRailKey(r.id), false));
                            }
                          }}
                        />
                        <span>Not sure</span>
                      </label>
                      <FieldError id={`merchant-receive-rails:${code}`} errors={fieldErrors} />
                    </div>
                  );
                }
              )}
              <FieldError id="merchant-receive-rails" errors={fieldErrors} />
            </div>
          )}

          <label className="field" data-field="merchant-settlement-bank">
            <span>
              Settlement bank name <span className="optional">Optional</span>
            </span>
            <input
              value={String(values["merchant-settlement-bank"] ?? values["settlement-bank"] ?? "")}
              onChange={(e) => {
                onChange("merchant-settlement-bank", e.target.value);
                onChange("settlement-bank", e.target.value);
              }}
            />
          </label>
        </>
      )}

      <div className="panel mb-4" data-field={MERCHANT_FIND_BANK_KEY}>
        <p className="field-label">Bank account assistance</p>
        {bankIncluded ? (
          <>
            <p className="hint mb-2">
              {fromStart || accountType === "both"
                ? MERCHANT_BANK_ASSIST_INCLUDED
                : MERCHANT_BANK_ASSIST_INCLUDED}
              {bankEntry === "start" ? " (selected at start)." : null}
            </p>
            <button type="button" className="btn mini" onClick={removeBankRequest}>
              {MERCHANT_BANK_ASSIST_REMOVE}
            </button>
          </>
        ) : (
          <label className="checkline">
            <input type="checkbox" checked={false} onChange={() => addBankRequest()} />
            <span>{MERCHANT_BANK_ASSIST_LABEL}</span>
          </label>
        )}
      </div>
    </>
  );
}
