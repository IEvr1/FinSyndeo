"use client";

import { useMemo, useState } from "react";
import { getSelectableCountries } from "@/lib/country-policy";
import { sharesReconcile } from "@/lib/matching/contract/merchant-math";
import {
  MERCHANT_METHOD_FAMILIES,
  MERCHANT_PROCESSING_CURRENCIES,
  MERCHANT_PROCESSING_CURRENCY_OTHER,
  MERCHANT_REGIONS,
  MERCHANT_REGIONS_NOTE,
  MERCHANT_SHARE_TOLERANCE,
  deriveAverage,
  marketsKey,
  namedMethodsForFamily,
  newMarketRowId,
  parseMarkets,
  serializeMarkets,
  type MerchantCurrencyLine,
  type MerchantMarketRow,
  type MerchantMethodLine,
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

function emptyMethod(): MerchantMethodLine {
  return { family: "", method: "", sharePercent: "", currencies: [] };
}

function emptyMarket(): MerchantMarketRow {
  return {
    id: newMarketRowId(),
    kind: "country",
    name: "",
    sharePercent: "",
    methods: [emptyMethod()],
  };
}

function shareTotalClass(ok: boolean) {
  return ok ? "hint" : "field-error";
}

export function MarketSchedule({ values, onChange, fieldErrors }: Props) {
  const countries = useMemo(() => getSelectableCountries("group1"), []);
  const markets = parseMarkets(values);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function save(next: MerchantMarketRow[]) {
    onChange(marketsKey, serializeMarkets(next));
  }

  function updateMarket(id: string, patch: Partial<MerchantMarketRow>) {
    save(markets.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function updateMethod(marketId: string, idx: number, patch: Partial<MerchantMethodLine>) {
    save(
      markets.map((m) => {
        if (m.id !== marketId) return m;
        const methods = m.methods.map((meth, i) => (i === idx ? { ...meth, ...patch } : meth));
        return { ...m, methods };
      })
    );
  }

  function updateCurrency(
    marketId: string,
    methodIdx: number,
    currIdx: number,
    patch: Partial<MerchantCurrencyLine>
  ) {
    save(
      markets.map((m) => {
        if (m.id !== marketId) return m;
        const methods = m.methods.map((meth, i) => {
          if (i !== methodIdx) return meth;
          const currencies = meth.currencies.map((c, ci) => (ci === currIdx ? { ...c, ...patch } : c));
          return { ...meth, currencies };
        });
        return { ...m, methods };
      })
    );
  }

  const marketShares = markets.map((m) => Number(m.sharePercent)).filter((n) => Number.isFinite(n));
  const marketTotal = sharesReconcile(marketShares, 100, MERCHANT_SHARE_TOLERANCE);

  return (
    <>
      <p className="lead">Customer markets and processing volumes</p>
      <p className="hint mb-3">{MERCHANT_REGIONS_NOTE}</p>

      <div className="mb-3" data-field={marketsKey}>
        <p className={shareTotalClass(marketTotal.ok || !markets.length)}>
          Market share total: {marketShares.length ? `${marketTotal.total}%` : "—"} (must be 100%)
        </p>
        <FieldError id={marketsKey} errors={fieldErrors} />
        <FieldError id={`${marketsKey}:total`} errors={fieldErrors} />
      </div>

      {markets.map((market, mi) => {
        const open = expanded[market.id] !== false;
        const methodShares = (market.methods ?? [])
          .map((m) => Number(m.sharePercent))
          .filter((n) => Number.isFinite(n));
        const methodTotal = sharesReconcile(methodShares, 100, MERCHANT_SHARE_TOLERANCE);
        const label = market.name || `Market ${mi + 1}`;

        return (
          <div key={market.id} className="panel mb-4 market-card" data-field={`${marketsKey}:${market.id}:name`}>
            <div className="flex justify-between items-center gap-3 mb-2">
              <button
                type="button"
                className="mini"
                onClick={() => setExpanded((e) => ({ ...e, [market.id]: !open }))}
                aria-expanded={open}
              >
                {open ? "Collapse" : "Expand"} · {label}
              </button>
              <button
                type="button"
                className="mini"
                onClick={() => save(markets.filter((m) => m.id !== market.id))}
              >
                Remove
              </button>
            </div>

            {open && (
              <div className="market-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="field">
                    <span>Kind</span>
                    <select
                      value={market.kind}
                      onChange={(e) =>
                        updateMarket(market.id, {
                          kind: e.target.value as "country" | "region",
                          name: "",
                        })
                      }
                    >
                      <option value="country">Country</option>
                      <option value="region">Region</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{market.kind === "region" ? "Region" : "Country"}</span>
                    {market.kind === "region" ? (
                      <select
                        value={market.name}
                        onChange={(e) => updateMarket(market.id, { name: e.target.value })}
                      >
                        <option value="">Select…</option>
                        {MERCHANT_REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={market.name}
                        onChange={(e) => updateMarket(market.id, { name: e.target.value })}
                      >
                        <option value="">Select…</option>
                        {countries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                  <label className="field" data-field={`${marketsKey}:${market.id}:share`}>
                    <span>Share of total monthly processing value (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={market.sharePercent}
                      onChange={(e) => updateMarket(market.id, { sharePercent: e.target.value })}
                    />
                  </label>
                </div>
                <FieldError id={`${marketsKey}:${market.id}:name`} errors={fieldErrors} />
                <FieldError id={`${marketsKey}:${market.id}:share`} errors={fieldErrors} />

                <p className={shareTotalClass(methodTotal.ok || !methodShares.length)}>
                  Payment-method share total within this market:{" "}
                  {methodShares.length ? `${methodTotal.total}%` : "—"} (must be 100%)
                </p>
                <FieldError id={`${marketsKey}:${market.id}:method-total`} errors={fieldErrors} />
                <FieldError id={`${marketsKey}:${market.id}:methods`} errors={fieldErrors} />

                {(market.methods ?? []).map((method, ji) => (
                  <div key={ji} className="panel nested-panel mb-3">
                    <div className="flex justify-between items-center gap-3 mb-2">
                      <h3 className="mt-0 mb-0">Method {ji + 1}</h3>
                      <button
                        type="button"
                        className="mini"
                        onClick={() =>
                          updateMarket(market.id, {
                            methods: market.methods.filter((_, i) => i !== ji),
                          })
                        }
                      >
                        Remove method
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="field">
                        <span>Family</span>
                        <select
                          value={method.family}
                          onChange={(e) =>
                            updateMethod(market.id, ji, {
                              family: e.target.value,
                              method: "",
                            })
                          }
                        >
                          <option value="">Select…</option>
                          {MERCHANT_METHOD_FAMILIES.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Method</span>
                        <select
                          value={method.method}
                          onChange={(e) => updateMethod(market.id, ji, { method: e.target.value })}
                          disabled={!method.family}
                        >
                          <option value="">Select…</option>
                          {namedMethodsForFamily(method.family).map((nm) => (
                            <option key={nm.id} value={nm.id}>
                              {nm.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field" data-field={`${marketsKey}:${market.id}:method:${ji}:share`}>
                        <span>Share within market (%)</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={method.sharePercent}
                          onChange={(e) =>
                            updateMethod(market.id, ji, { sharePercent: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <FieldError
                      id={`${marketsKey}:${market.id}:method:${ji}:share`}
                      errors={fieldErrors}
                    />
                    <FieldError
                      id={`${marketsKey}:${market.id}:method:${ji}:currencies`}
                      errors={fieldErrors}
                    />

                    <p className="field-label mt-3">Processing currencies</p>
                    {(method.currencies ?? []).map((line, ci) => {
                      const avg = line.unknown
                        ? null
                        : deriveAverage(line.monthlyValue, line.monthlyCount);
                      return (
                        <div key={ci} className="panel nested-panel mb-2">
                          <div className="flex justify-between items-center gap-2 mb-2">
                            <label className="field mb-0" style={{ flex: 1 }}>
                              <span>Currency</span>
                              <select
                                value={
                                  MERCHANT_PROCESSING_CURRENCIES.includes(
                                    line.currency as (typeof MERCHANT_PROCESSING_CURRENCIES)[number]
                                  )
                                    ? line.currency
                                    : line.currency
                                      ? "Other"
                                      : ""
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateCurrency(market.id, ji, ci, {
                                    currency: v === "Other" ? "" : v,
                                  });
                                }}
                              >
                                <option value="">Select…</option>
                                {MERCHANT_PROCESSING_CURRENCIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                                <option value="Other">{MERCHANT_PROCESSING_CURRENCY_OTHER.label}</option>
                              </select>
                            </label>
                            <button
                              type="button"
                              className="mini"
                              onClick={() =>
                                updateMethod(market.id, ji, {
                                  currencies: method.currencies.filter((_, i) => i !== ci),
                                })
                              }
                            >
                              Remove
                            </button>
                          </div>
                          {(line.currency === "" ||
                            (!MERCHANT_PROCESSING_CURRENCIES.includes(
                              line.currency as (typeof MERCHANT_PROCESSING_CURRENCIES)[number]
                            ) &&
                              line.currency)) && (
                            <label className="field">
                              <span>ISO currency code</span>
                              <input
                                value={
                                  MERCHANT_PROCESSING_CURRENCIES.includes(
                                    line.currency as (typeof MERCHANT_PROCESSING_CURRENCIES)[number]
                                  )
                                    ? ""
                                    : line.currency
                                }
                                onChange={(e) =>
                                  updateCurrency(market.id, ji, ci, {
                                    currency: e.target.value.toUpperCase(),
                                  })
                                }
                                placeholder="e.g. CHF"
                              />
                              <small className="hint">{MERCHANT_PROCESSING_CURRENCY_OTHER.helper}</small>
                            </label>
                          )}

                          <label className="checkline">
                            <input
                              type="checkbox"
                              checked={line.unknown === true}
                              onChange={(e) =>
                                updateCurrency(market.id, ji, ci, {
                                  unknown: e.target.checked,
                                  monthlyValue: e.target.checked ? "" : line.monthlyValue,
                                  monthlyCount: e.target.checked ? "" : line.monthlyCount,
                                })
                              }
                            />
                            <span>Not yet known</span>
                          </label>

                          {!line.unknown && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <label
                                className="field"
                                data-field={`${marketsKey}:${market.id}:method:${ji}:curr:${ci}:value`}
                              >
                                <span>Monthly processing value</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={line.monthlyValue ?? ""}
                                  onChange={(e) =>
                                    updateCurrency(market.id, ji, ci, {
                                      monthlyValue: e.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label
                                className="field"
                                data-field={`${marketsKey}:${market.id}:method:${ji}:curr:${ci}:count`}
                              >
                                <span>Monthly transaction count</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={line.monthlyCount ?? ""}
                                  onChange={(e) =>
                                    updateCurrency(market.id, ji, ci, {
                                      monthlyCount: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                          )}
                          {avg !== null && (
                            <p className="hint">
                              Average (estimate):{" "}
                              {avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          )}
                          <FieldError
                            id={`${marketsKey}:${market.id}:method:${ji}:curr:${ci}:value`}
                            errors={fieldErrors}
                          />
                          <FieldError
                            id={`${marketsKey}:${market.id}:method:${ji}:curr:${ci}:count`}
                            errors={fieldErrors}
                          />
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      className="btn mini"
                      onClick={() =>
                        updateMethod(market.id, ji, {
                          currencies: [
                            ...method.currencies,
                            { currency: "", monthlyValue: "", monthlyCount: "", unknown: false },
                          ],
                        })
                      }
                    >
                      Add currency
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    updateMarket(market.id, { methods: [...(market.methods ?? []), emptyMethod()] })
                  }
                >
                  Add payment method
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" className="btn" onClick={() => save([...markets, emptyMarket()])}>
        Add country / region
      </button>
    </>
  );
}
