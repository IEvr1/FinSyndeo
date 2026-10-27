"use client";

import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import {
  MERCHANT_CHANNELS,
  MERCHANT_FULFILMENT,
  MERCHANT_FULFILMENT_HELPER,
  MERCHANT_GATEWAY_KEEP,
  MERCHANT_MOTO,
  MERCHANT_PAY_PATTERNS,
  MERCHANT_PLATFORMS,
  MERCHANT_SALES_ROLE,
  channelKey,
  isPlatformOther,
  payPatternKey,
  platformOtherKey,
  salesRoleKey,
} from "@/lib/questionnaire/merchant-config";
import type { CountryPickers, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

export type MerchantStepProps = {
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

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes" || v === "on";
}

export function ChannelsStep({ values, pickers, onChange, onPickerChange, fieldErrors }: MerchantStepProps) {
  const online = bool(values[channelKey("online")]) || bool(values.online);
  const pos = bool(values[channelKey("pos")]) || bool(values.pos);
  const sameAsWebsite = bool(values["checkout-same-as-website"]);
  const platform = String(values.platform || values["merchant-platform"] || "");
  const salesRole = String(values[salesRoleKey()] ?? "");
  const storeNotDecided =
    String(values["store-countries-status"] ?? "") === "not_yet_decided" || bool(values["store-not-yet-decided"]);

  return (
    <>
      <p className="lead">How will customers pay you?</p>

      <div className="panel mb-4" data-field={channelKey("online")}>
        <p className="field-label">Payment channels</p>
        <p className="hint mb-3">Select at least one.</p>
        <div className="grid gap-3">
          {MERCHANT_CHANNELS.map((ch) => {
            const key = channelKey(ch.id);
            const on = bool(values[key]) || bool(values[ch.id]);
            return (
              <label key={ch.id} className="checkline" style={{ marginBottom: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    onChange(key, e.target.checked);
                    onChange(ch.id, e.target.checked);
                  }}
                />
                <span>{ch.label}</span>
              </label>
            );
          })}
        </div>
        <FieldError id={channelKey("online")} errors={fieldErrors} />
      </div>

      {online && (
        <div className="panel mb-4">
          <h3 className="mt-0">Online payments</h3>
          <label className="checkline" data-field="checkout-same-as-website">
            <input
              type="checkbox"
              checked={sameAsWebsite}
              onChange={(e) => onChange("checkout-same-as-website", e.target.checked)}
            />
            <span>Checkout is the same as the company website</span>
          </label>

          {!sameAsWebsite && (
            <>
              <label className="field" data-field="checkout-url">
                <span>Checkout URL(s)</span>
                <textarea
                  rows={3}
                  value={String(values["checkout-url"] || values["payment-website"] || "")}
                  onChange={(e) => {
                    onChange("checkout-url", e.target.value);
                    onChange("checkout-status", e.target.value.trim() ? "available" : "");
                  }}
                  placeholder="One URL per line"
                />
              </label>
              <FieldError id="checkout-url" errors={fieldErrors} />
              <FieldError id="checkout-status" errors={fieldErrors} />
            </>
          )}

          <label className="field" data-field="platform">
            <span>Shop or website platform</span>
            <select
              value={platform}
              onChange={(e) => {
                onChange("platform", e.target.value);
                onChange("merchant-platform", e.target.value);
                if (!isPlatformOther(e.target.value)) onChange(platformOtherKey(), "");
              }}
            >
              <option value="">Select…</option>
              {MERCHANT_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {isPlatformOther(platform) && (
            <>
              <label className="field" data-field={platformOtherKey()}>
                <span>Specify the platform</span>
                <input
                  value={String(values[platformOtherKey()] ?? "")}
                  onChange={(e) => onChange(platformOtherKey(), e.target.value)}
                />
              </label>
              <FieldError id={platformOtherKey()} errors={fieldErrors} />
            </>
          )}

          <label className="field" data-field="gateway">
            <span>
              Existing payment gateway <span className="optional">Optional</span>
            </span>
            <input
              value={String(values.gateway || values["merchant-gateway"] || values["existing-gateway"] || "")}
              onChange={(e) => {
                onChange("gateway", e.target.value);
                onChange("merchant-gateway", e.target.value);
              }}
              placeholder="e.g. Stripe, Adyen"
            />
          </label>

          {String(values.gateway || values["merchant-gateway"] || "").trim() !== "" && (
            <>
              <label className="field" data-field="gateway-keep">
                <span>Must you keep this gateway?</span>
                <select
                  value={String(values["gateway-keep"] || values["merchant-gateway-keep"] || "")}
                  onChange={(e) => {
                    onChange("gateway-keep", e.target.value);
                    onChange("merchant-gateway-keep", e.target.value);
                  }}
                >
                  <option value="">Select…</option>
                  {MERCHANT_GATEWAY_KEEP.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <FieldError id="gateway-keep" errors={fieldErrors} />
            </>
          )}
        </div>
      )}

      {pos && (
        <div className="panel mb-4">
          <h3 className="mt-0">In-person POS</h3>
          <div data-field="store-countries">
            <CountryMultiSelect
              id="physical-store-countries"
              label="Physical store countries"
              required={!storeNotDecided}
              value={pickers["physical-store-countries"] ?? pickers["store-countries"] ?? []}
              onChange={(next) => {
                onPickerChange("physical-store-countries", next);
                onPickerChange("store-countries", next);
                if (next.length) {
                  onChange("store-countries-status", "");
                  onChange("store-not-yet-decided", false);
                }
              }}
            />
            <FieldError id="store-countries" errors={fieldErrors} />
          </div>
          <label className="checkline">
            <input
              type="checkbox"
              checked={storeNotDecided}
              onChange={(e) => {
                const on = e.target.checked;
                onChange("store-not-yet-decided", on);
                onChange("store-countries-status", on ? "not_yet_decided" : "");
                if (on) {
                  onPickerChange("physical-store-countries", []);
                  onPickerChange("store-countries", []);
                }
              }}
            />
            <span>Not yet decided</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="field" data-field="store-locations">
              <span>Number of locations</span>
              <input
                type="number"
                min={0}
                value={String(values["store-locations"] ?? values["pos-locations"] ?? "")}
                onChange={(e) => onChange("store-locations", e.target.value)}
              />
            </label>
            <label className="field" data-field="pos-terminals">
              <span>Number of terminals needed</span>
              <input
                type="number"
                min={0}
                value={String(values["pos-terminals"] ?? values["store-terminals"] ?? "")}
                onChange={(e) => onChange("pos-terminals", e.target.value)}
              />
            </label>
          </div>
          <label className="field" data-field="terminal-preference">
            <span>
              Terminal preference <span className="optional">Optional</span>
            </span>
            <input
              value={String(values["terminal-preference"] ?? "")}
              onChange={(e) => onChange("terminal-preference", e.target.value)}
              placeholder="e.g. countertop, softPOS"
            />
          </label>
        </div>
      )}

      <label className="field" data-field={salesRoleKey()}>
        <span>Whose sales will you collect payments for?</span>
        <select
          value={salesRole}
          onChange={(e) => {
            onChange(salesRoleKey(), e.target.value);
            if (e.target.value === "own") onChange("sales-model-description", "");
          }}
        >
          <option value="">Select…</option>
          {MERCHANT_SALES_ROLE.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {MERCHANT_SALES_ROLE.find((r) => r.value === salesRole)?.helper ? (
          <small className="hint">{MERCHANT_SALES_ROLE.find((r) => r.value === salesRole)?.helper}</small>
        ) : null}
      </label>
      <FieldError id={salesRoleKey()} errors={fieldErrors} />

      {(salesRole === "marketplace" || salesRole === "both") && (
        <>
          <label className="field" data-field="sales-model-description">
            <span>Describe the marketplace / platform model and where sellers are based</span>
            <textarea
              rows={3}
              value={String(values["sales-model-description"] || values["marketplace-model"] || "")}
              onChange={(e) => onChange("sales-model-description", e.target.value)}
            />
          </label>
          <FieldError id="sales-model-description" errors={fieldErrors} />
        </>
      )}

      <div className="panel mb-4" data-field={payPatternKey("one_off")}>
        <p className="field-label">How do customers pay?</p>
        <p className="hint mb-3">Select at least one payment pattern.</p>
        {MERCHANT_PAY_PATTERNS.map((p) => (
          <label key={p.id} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="checkbox"
              checked={bool(values[payPatternKey(p.id)])}
              onChange={(e) => onChange(payPatternKey(p.id), e.target.checked)}
            />
            <span>{p.label}</span>
          </label>
        ))}
        <label className="checkline" style={{ marginTop: "0.75rem" }}>
          <input
            type="checkbox"
            checked={bool(values[payPatternKey(MERCHANT_MOTO.id)])}
            onChange={(e) => onChange(payPatternKey(MERCHANT_MOTO.id), e.target.checked)}
          />
          <span>
            {MERCHANT_MOTO.label} <span className="optional">Optional</span>
          </span>
        </label>
        <small className="hint">{MERCHANT_MOTO.helper}</small>
        <FieldError id={payPatternKey("one_off")} errors={fieldErrors} />
      </div>

      <label className="field" data-field="fulfilment">
        <span>Typical time from payment to delivery or service</span>
        <select
          value={String(values.fulfilment || values["merchant-fulfilment"] || "")}
          onChange={(e) => {
            onChange("fulfilment", e.target.value);
            onChange("merchant-fulfilment", e.target.value);
          }}
        >
          <option value="">Select…</option>
          {MERCHANT_FULFILMENT.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <small className="hint">{MERCHANT_FULFILMENT_HELPER}</small>
      </label>
      <FieldError id="fulfilment" errors={fieldErrors} />
    </>
  );
}
