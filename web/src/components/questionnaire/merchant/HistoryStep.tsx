"use client";

import {
  MERCHANT_HISTORY_STATUS,
  MERCHANT_PCI_HELPER,
  MERCHANT_PCI_STATUS,
  MERCHANT_STATEMENT_AVAILABILITY,
  MERCHANT_STATEMENT_NOTE,
  chargebackCountKey,
  chargebackRatioKey,
  chargebackUnavailableKey,
  formatChargebackMonthLabel,
  lastSixCompletedMonths,
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

function applicableMonths(values: QuestionnaireValues): string[] {
  const all = lastSixCompletedMonths();
  const raw = Number(String(values["merchant-history-months"] ?? values["history-months"] ?? values["completed-months"] ?? "").replace(/,/g, ""));
  if (!Number.isFinite(raw)) return all;
  const completed = Math.max(0, Math.min(6, Math.floor(raw)));
  if (completed === 0) return [];
  return all.slice(0, completed);
}

export function HistoryStep({ values, onChange, fieldErrors }: Props) {
  const status = String(values["merchant-history-status"] || values.history || "");
  const experienced = status === "currently" || status === "previously";
  const months = applicableMonths(values);

  return (
    <>
      <p className="lead">Processing history</p>

      <fieldset className="field" data-field="merchant-history-status">
        <legend className="field-label">Card processing status</legend>
        {MERCHANT_HISTORY_STATUS.map((s) => (
          <label key={s.value} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="radio"
              name="merchant-history-status"
              checked={status === s.value}
              onChange={() => {
                onChange("merchant-history-status", s.value);
                onChange("history", s.value);
              }}
            />
            <span>{s.label}</span>
          </label>
        ))}
      </fieldset>
      <FieldError id="merchant-history-status" errors={fieldErrors} />

      {experienced && (
        <>
          <label className="field" data-field="merchant-history-months">
            <span>Completed processing months</span>
            <input
              type="number"
              min={0}
              max={120}
              step={1}
              value={String(
                values["merchant-history-months"] ??
                  values["history-months"] ??
                  values["completed-months"] ??
                  ""
              )}
              onChange={(e) => {
                onChange("merchant-history-months", e.target.value);
                onChange("history-months", e.target.value);
                onChange("completed-months", e.target.value);
              }}
            />
            <small className="hint">0 is allowed for a new launch. Chargeback grid uses up to the last 6 completed calendar months.</small>
          </label>
          <FieldError id="merchant-history-months" errors={fieldErrors} />
        </>
      )}

      <label className="field" data-field="merchant-statement-availability">
        <span>
          Statement availability <span className="optional">Optional</span>
        </span>
        <select
          value={String(values["merchant-statement-availability"] ?? "")}
          onChange={(e) => onChange("merchant-statement-availability", e.target.value)}
        >
          <option value="">Select…</option>
          {MERCHANT_STATEMENT_AVAILABILITY.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <small className="hint">{MERCHANT_STATEMENT_NOTE}</small>
      </label>

      <label className="field" data-field="merchant-current-provider">
        <span>
          Current processing provider <span className="optional">Optional</span>
        </span>
        <input
          value={String(values["merchant-current-provider"] ?? values["current-provider"] ?? "")}
          onChange={(e) => {
            onChange("merchant-current-provider", e.target.value);
            onChange("current-provider", e.target.value);
          }}
        />
      </label>

      {experienced && months.length > 0 && (
        <div className="panel mb-4">
          <h3 className="mt-0">Chargebacks — last completed months</h3>
          <p className="hint mb-3">
            Enter count and chargeback-to-sales ratio (%), or mark figures unavailable with an explanation.
          </p>
          <div className="grid gap-3">
            {months.map((ym) => {
              const unavailable = bool(values[chargebackUnavailableKey(ym)]);
              const reasonKey = `${chargebackUnavailableKey(ym)}-reason`;
              return (
                <div key={ym} className="panel nested-panel">
                  <h3 className="mt-0 mb-2">{formatChargebackMonthLabel(ym)}</h3>
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={unavailable}
                      onChange={(e) => {
                        onChange(chargebackUnavailableKey(ym), e.target.checked);
                        if (e.target.checked) {
                          onChange(chargebackCountKey(ym), "");
                          onChange(chargebackRatioKey(ym), "");
                        }
                      }}
                    />
                    <span>Figures unavailable</span>
                  </label>
                  {unavailable ? (
                    <>
                      <label className="field" data-field={reasonKey}>
                        <span>Explanation</span>
                        <textarea
                          rows={2}
                          value={String(
                            values[`merchant-cb-unavailable-reason:${ym}`] || values[reasonKey] || ""
                          )}
                          onChange={(e) => {
                            onChange(reasonKey, e.target.value);
                            onChange(`merchant-cb-unavailable-reason:${ym}`, e.target.value);
                          }}
                        />
                      </label>
                      <FieldError id={reasonKey} errors={fieldErrors} />
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="field" data-field={chargebackCountKey(ym)}>
                        <span>Chargeback count</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={String(values[chargebackCountKey(ym)] ?? "")}
                          onChange={(e) => onChange(chargebackCountKey(ym), e.target.value)}
                        />
                      </label>
                      <label className="field" data-field={chargebackRatioKey(ym)}>
                        <span>Chargeback ratio (%)</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={String(values[chargebackRatioKey(ym)] ?? "")}
                          onChange={(e) => onChange(chargebackRatioKey(ym), e.target.value)}
                        />
                      </label>
                      <FieldError id={chargebackCountKey(ym)} errors={fieldErrors} />
                      <FieldError id={chargebackRatioKey(ym)} errors={fieldErrors} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <label className="field" data-field="merchant-fraud">
        <span>
          Fraud ratio (%) <span className="optional">Optional</span>
        </span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={String(values["merchant-fraud"] ?? values["fraud-ratio"] ?? "")}
          onChange={(e) => {
            onChange("merchant-fraud", e.target.value);
            onChange("fraud-ratio", e.target.value);
          }}
        />
      </label>

      <label className="field" data-field="merchant-pci">
        <span>
          PCI posture <span className="optional">Optional</span>
        </span>
        <select
          value={String(values["merchant-pci"] ?? "")}
          onChange={(e) => onChange("merchant-pci", e.target.value)}
        >
          <option value="">Select…</option>
          {MERCHANT_PCI_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <small className="hint">{MERCHANT_PCI_HELPER}</small>
      </label>
    </>
  );
}
