"use client";

import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import { CountrySearchSelect } from "@/components/questionnaire/CountrySearchSelect";
import { BankRequirementsStep } from "@/components/questionnaire/merchant/BankRequirementsStep";
import { ChannelsStep } from "@/components/questionnaire/merchant/ChannelsStep";
import { HistoryStep } from "@/components/questionnaire/merchant/HistoryStep";
import { MarketSchedule } from "@/components/questionnaire/merchant/MarketSchedule";
import { SettlementStep } from "@/components/questionnaire/merchant/SettlementStep";
import { EU } from "@/lib/provider-apply/config";
import {
  MERCHANT_INDUSTRIES,
  MERCHANT_LICENCE_ANSWERS,
  MERCHANT_METHOD_FAMILIES,
  MERCHANT_OFFICE_STATUS,
  MERCHANT_PROCESSING_CURRENCIES,
  MERCHANT_WEBSITE_STATUS,
  deriveAverage,
  methodFamilyLabel,
  namedMethodLabel,
  namedMethodsForFamily,
  parseMarkets,
} from "@/lib/questionnaire/merchant-config";
import { isCombinedBankMerchant, isMerchantRoute } from "@/lib/questionnaire/validate-merchant";
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

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes" || v === "on";
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseJsonList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const INDUSTRY_GAMBLING = "Gambling & betting — real-money wagering";
const INDUSTRY_FOREX = "Forex brokerage & CFD dealing";
const UBO_COVERAGE_TARGET = 75;

type CorpRow = { id: string; jurisdiction: string; shareholding: string };
type UboRow = {
  id: string;
  ownership: string;
  nationalities?: string[];
  residence?: string;
};
type RoleRow = { id: string; role?: string; nationalities?: string[]; residence?: string };
type FutureMethod = {
  id: string;
  family: string;
  method: string;
  market?: string;
  currency?: string;
  notDecided?: boolean;
  forDiscussion?: boolean;
};

function euPaymentAgentApplicable(values: QuestionnaireValues): boolean {
  const industry = String(values.industry ?? "");
  if (industry !== INDUSTRY_GAMBLING && industry !== INDUSTRY_FOREX) return false;
  const inc = String(values.incorporation ?? "").trim();
  if (!inc) return false;
  return !EU.includes(inc);
}

function isAssociation(entityType: string): boolean {
  return /^association$/i.test(entityType.trim());
}

function isPrivateLimited(entityType: string): boolean {
  return /private limited company/i.test(entityType);
}

function BusinessActivityStep({ values, pickers, onChange, onPickerChange, fieldErrors }: Omit<Props, "step">) {
  const websiteStatus = String(values["website-status"] || values["merchant-website-status"] || "");
  const industry = String(values.industry ?? "");
  const licence = String(values.licence ?? "");
  const offices = String(values.offices || values["office-status"] || values["merchant-office-status"] || "");
  const showEuAgent = euPaymentAgentApplicable(values);

  return (
    <>
      <p className="lead">Business activity</p>

      <fieldset className="field" data-field="website-status">
        <legend className="field-label">Company website</legend>
        {MERCHANT_WEBSITE_STATUS.map((s) => (
          <label key={s.value} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="radio"
              name="website-status"
              checked={websiteStatus === s.value}
              onChange={() => {
                onChange("website-status", s.value);
                onChange("merchant-website-status", s.value);
              }}
            />
            <span>{s.label}</span>
          </label>
        ))}
      </fieldset>
      <FieldError id="website-status" errors={fieldErrors} />

      {websiteStatus === "available" && (
        <>
          <label className="field" data-field="website">
            <span>Website URL</span>
            <input
              type="url"
              value={String(values.website ?? "")}
              onChange={(e) => onChange("website", e.target.value)}
              placeholder="https://"
            />
          </label>
          <FieldError id="website" errors={fieldErrors} />
        </>
      )}

      {(websiteStatus === "under_development" || websiteStatus === "not_applicable") && (
        <>
          <label className="field" data-field="website-reason">
            <span>Brief reason</span>
            <textarea
              rows={2}
              value={String(values["website-reason"] || values["website-unavailable-reason"] || "")}
              onChange={(e) => {
                onChange("website-reason", e.target.value);
                onChange("website-unavailable-reason", e.target.value);
              }}
            />
          </label>
          <FieldError id="website-reason" errors={fieldErrors} />
        </>
      )}

      <label className="field" data-field="website-summary">
        <span>Website summary</span>
        <textarea
          rows={4}
          value={String(values["website-summary"] ?? "")}
          onChange={(e) => onChange("website-summary", e.target.value)}
          placeholder="Retrieved summary or your own description of the site and offering"
        />
        <small className="hint">
          You can enter a summary manually even if automatic retrieval has not run yet.
        </small>
      </label>
      <label className="checkline" data-field="website-summary-confirmed">
        <input
          type="checkbox"
          checked={values["website-summary-confirmed"] === true}
          onChange={(e) => onChange("website-summary-confirmed", e.target.checked)}
        />
        <span>I have reviewed this summary</span>
      </label>

      <label className="field" data-field="industry">
        <span>Industry</span>
        <select
          value={industry}
          onChange={(e) => {
            onChange("industry", e.target.value);
            if (!/^other$/i.test(e.target.value)) onChange("industry-other", "");
          }}
        >
          <option value="">Select…</option>
          {MERCHANT_INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </label>
      <FieldError id="industry" errors={fieldErrors} />
      {/^other$/i.test(industry) && (
        <>
          <label className="field" data-field="industry-other">
            <span>Please specify your industry</span>
            <input
              value={String(values["industry-other"] || values["industry-other-text"] || "")}
              onChange={(e) => onChange("industry-other", e.target.value)}
            />
          </label>
          <FieldError id="industry-other" errors={fieldErrors} />
        </>
      )}

      <label className="field" data-field="activity">
        <span>Describe your products/services, customers and operating model</span>
        <textarea
          rows={4}
          value={String(values.activity ?? "")}
          onChange={(e) => onChange("activity", e.target.value)}
        />
      </label>
      <FieldError id="activity" errors={fieldErrors} />

      <fieldset className="field" data-field="licence">
        <legend className="field-label">Is a licence or authorisation required?</legend>
        {MERCHANT_LICENCE_ANSWERS.map((a) => (
          <label key={a.value} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="radio"
              name="licence"
              checked={licence === a.value}
              onChange={() => onChange("licence", a.value)}
            />
            <span>{a.label}</span>
          </label>
        ))}
      </fieldset>
      <FieldError id="licence" errors={fieldErrors} />

      {licence === "Yes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="field" data-field="licence-name">
            <span>Licence / authorisation name</span>
            <input
              value={String(values["licence-name"] ?? "")}
              onChange={(e) => onChange("licence-name", e.target.value)}
            />
            <FieldError id="licence-name" errors={fieldErrors} />
          </label>
          <label className="field" data-field="licence-number">
            <span>Licence number / reference</span>
            <input
              value={String(values["licence-number"] ?? "")}
              onChange={(e) => onChange("licence-number", e.target.value)}
            />
            <FieldError id="licence-number" errors={fieldErrors} />
          </label>
          <label className="field" data-field="licence-authority">
            <span>Issuing authority</span>
            <input
              value={String(values["licence-authority"] ?? "")}
              onChange={(e) => onChange("licence-authority", e.target.value)}
            />
            <FieldError id="licence-authority" errors={fieldErrors} />
          </label>
          <label className="field" data-field="licence-jurisdiction">
            <span>Licence jurisdiction</span>
            <input
              value={String(values["licence-jurisdiction"] ?? "")}
              onChange={(e) => onChange("licence-jurisdiction", e.target.value)}
            />
            <FieldError id="licence-jurisdiction" errors={fieldErrors} />
          </label>
        </div>
      )}

      {showEuAgent && (
        <fieldset className="field" data-field="eu-payment-agent">
          <legend className="field-label">EU payment agent</legend>
          <p className="hint mb-2">
            Relevant for gambling or forex/CFD businesses incorporated outside the EU. This is not a
            corporate-services referral offer.
          </p>
          <label className="checkline">
            <input
              type="radio"
              name="eu-payment-agent"
              checked={String(values["eu-payment-agent"] ?? "") === "Yes"}
              onChange={() => onChange("eu-payment-agent", "Yes")}
            />
            <span>Yes — interested in an EU payment-agent arrangement</span>
          </label>
          <label className="checkline">
            <input
              type="radio"
              name="eu-payment-agent"
              checked={String(values["eu-payment-agent"] ?? "") === "No"}
              onChange={() => onChange("eu-payment-agent", "No")}
            />
            <span>No</span>
          </label>
        </fieldset>
      )}

      <fieldset className="field" data-field="offices">
        <legend className="field-label">Offices</legend>
        {MERCHANT_OFFICE_STATUS.map((o) => (
          <label key={o.value} className="checkline" style={{ marginBottom: "0.5rem" }}>
            <input
              type="radio"
              name="offices"
              checked={offices === o.value}
              onChange={() => {
                onChange("offices", o.value);
                onChange("office-status", o.value);
                onChange("merchant-office-status", o.value);
              }}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>
      <FieldError id="offices" errors={fieldErrors} />

      {offices === "other_countries" && (
        <div data-field="operating-countries">
          <CountryMultiSelect
            id="operating-countries"
            label="Other operating countries"
            required
            value={pickers["operating-countries"] ?? pickers["office-countries"] ?? []}
            onChange={(next) => {
              onPickerChange("operating-countries", next);
              onPickerChange("office-countries", next);
            }}
          />
          <FieldError id="operating-countries" errors={fieldErrors} />
        </div>
      )}

      <label className="field" data-field="employees">
        <span>Number of employees</span>
        <input
          value={String(values.employees ?? "")}
          onChange={(e) => onChange("employees", e.target.value)}
          placeholder="e.g. 12 or 1–5"
        />
      </label>
      <FieldError id="employees" errors={fieldErrors} />
    </>
  );
}

function OwnershipStep({ values, pickers, onChange, onPickerChange, fieldErrors }: Omit<Props, "step">) {
  const entityType = String(values["entity-type"] ?? "");
  const association = isAssociation(entityType);
  const privateCo = isPrivateLimited(entityType) || (!association && Boolean(entityType));
  const corp = String(values.corporate ?? "");
  const group = String(values.group ?? "");

  const corps = parseJsonList<CorpRow>(
    values["merchant-corporate-shareholders"] || values["co-corporate-shareholders"]
  );
  const ubos = parseJsonList<UboRow>(values["merchant-ubos"] || values["co-ubos"]);
  const roles = parseJsonList<RoleRow>(values["merchant-governing-roles"]);

  function saveCorps(next: CorpRow[]) {
    onChange("merchant-corporate-shareholders", JSON.stringify(next));
  }
  function saveUbos(next: UboRow[]) {
    onChange("merchant-ubos", JSON.stringify(next));
  }
  function saveRoles(next: RoleRow[]) {
    onChange("merchant-governing-roles", JSON.stringify(next));
  }

  const uboTotal = ubos.reduce((sum, u) => sum + (Number(u.ownership) || 0), 0);

  return (
    <>
      <p className="lead">Ownership and control</p>
      <p className="hint mb-3">
        Do not enter personal names or identity documents at this stage — nationality, residence and ownership % only.
      </p>

      {privateCo && !association && (
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
            <div data-field="merchant-corporate-shareholders">
              {corps.map((row, idx) => (
                <div key={row.id} className="panel nested-panel mb-3">
                  <div className="flex justify-between items-center gap-3 mb-2">
                    <h3 className="mt-0 mb-0">Corporate shareholder {idx + 1}</h3>
                    <button
                      type="button"
                      className="mini"
                      onClick={() => saveCorps(corps.filter((r) => r.id !== row.id))}
                    >
                      Remove
                    </button>
                  </div>
                  <div data-field={`merchant-corp-${row.id}-jurisdiction`}>
                    <CountrySearchSelect
                      id={`merchant-corp-j-${row.id}`}
                      label="Incorporation jurisdiction"
                      required
                      value={row.jurisdiction}
                      onChange={(v) =>
                        saveCorps(corps.map((r) => (r.id === row.id ? { ...r, jurisdiction: v } : r)))
                      }
                    />
                    <FieldError id={`merchant-corp-${row.id}-jurisdiction`} errors={fieldErrors} />
                  </div>
                  <label className="field" data-field={`merchant-corp-${row.id}-pct`}>
                    <span>Shareholding in the applicant company (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={row.shareholding}
                      onChange={(e) =>
                        saveCorps(
                          corps.map((r) => (r.id === row.id ? { ...r, shareholding: e.target.value } : r))
                        )
                      }
                    />
                  </label>
                  <FieldError id={`merchant-corp-${row.id}-pct`} errors={fieldErrors} />
                </div>
              ))}
              <button
                type="button"
                className="btn mb-4"
                onClick={() => saveCorps([...corps, { id: newId("corp"), jurisdiction: "", shareholding: "" }])}
              >
                Add corporate shareholder
              </button>
              <FieldError id="merchant-corporate-shareholders" errors={fieldErrors} />
            </div>
          )}

          <h3>Beneficial owners</h3>
          <p className="hint mb-3">
            Aim for at least {UBO_COVERAGE_TARGET}% coverage for this initial assessment.
          </p>
          {ubos.map((ubo, idx) => {
            const natKey = `merchant-ubo-nat-${ubo.id}`;
            const nats = pickers[natKey] ?? ubo.nationalities ?? [];
            return (
              <div key={ubo.id} className="panel nested-panel mb-3" data-field={`merchant-ubo-${ubo.id}-pct`}>
                <div className="flex justify-between items-center gap-3 mb-2">
                  <h3 className="mt-0 mb-0">Beneficial owner {idx + 1}</h3>
                  <button
                    type="button"
                    className="mini"
                    onClick={() => saveUbos(ubos.filter((u) => u.id !== ubo.id))}
                  >
                    Remove
                  </button>
                </div>
                <label className="field">
                  <span>Beneficial ownership (%)</span>
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
                <FieldError id={`merchant-ubo-${ubo.id}-pct`} errors={fieldErrors} />
                <div data-field={`merchant-ubo-${ubo.id}-nat`}>
                  <CountryMultiSelect
                    id={natKey}
                    label="Nationality or nationalities"
                    required
                    value={nats}
                    onChange={(next) => {
                      onPickerChange(natKey, next);
                      saveUbos(ubos.map((u) => (u.id === ubo.id ? { ...u, nationalities: next } : u)));
                    }}
                  />
                  <FieldError id={`merchant-ubo-${ubo.id}-nat`} errors={fieldErrors} />
                </div>
                <div data-field={`merchant-ubo-${ubo.id}-res`}>
                  <CountrySearchSelect
                    id={`merchant-ubo-res-${ubo.id}`}
                    label="Country of residence"
                    required
                    value={
                      ubo.residence ||
                      String(values[`merchant-ubo-res-${ubo.id}`] ?? "") ||
                      ""
                    }
                    onChange={(v) => {
                      onChange(`merchant-ubo-res-${ubo.id}`, v);
                      saveUbos(ubos.map((u) => (u.id === ubo.id ? { ...u, residence: v } : u)));
                    }}
                  />
                  <FieldError id={`merchant-ubo-${ubo.id}-res`} errors={fieldErrors} />
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className="btn mb-2"
            onClick={() =>
              saveUbos([
                ...ubos,
                { id: newId("ubo"), ownership: "", nationalities: [], residence: "" },
              ])
            }
          >
            Add beneficial owner
          </button>
          <p className="hint mb-3">
            Current coverage toward {UBO_COVERAGE_TARGET}%: {uboTotal.toFixed(2)}%
          </p>
          <FieldError id="merchant-ubos" errors={fieldErrors} />

          {uboTotal < UBO_COVERAGE_TARGET && (
            <>
              <label className="field" data-field="ownership-clarification">
                <span>Ownership or control clarification</span>
                <textarea
                  rows={3}
                  value={String(values["ownership-clarification"] ?? "")}
                  onChange={(e) => onChange("ownership-clarification", e.target.value)}
                  placeholder="Explain remaining ownership or control"
                />
              </label>
              <FieldError id="ownership-clarification" errors={fieldErrors} />
            </>
          )}
        </>
      )}

      {association && (
        <div data-field="merchant-governing-roles">
          <h3>Governing roles</h3>
          <p className="hint mb-3">
            Add governing committee / board or senior managing roles (nationality and residence; no shareholding %).
          </p>
          {roles.map((role, idx) => {
            const natKey = `merchant-role-nat-${role.id}`;
            return (
              <div key={role.id} className="panel nested-panel mb-3">
                <div className="flex justify-between items-center gap-3 mb-2">
                  <h3 className="mt-0 mb-0">Role {idx + 1}</h3>
                  <button
                    type="button"
                    className="mini"
                    onClick={() => saveRoles(roles.filter((r) => r.id !== role.id))}
                  >
                    Remove
                  </button>
                </div>
                <label className="field">
                  <span>Governing role</span>
                  <input
                    value={role.role ?? ""}
                    onChange={(e) =>
                      saveRoles(roles.map((r) => (r.id === role.id ? { ...r, role: e.target.value } : r)))
                    }
                    placeholder="e.g. Board member, Chair"
                  />
                </label>
                <div data-field={`merchant-role-${role.id}-nat`}>
                  <CountryMultiSelect
                    id={natKey}
                    label="Nationality or nationalities"
                    required
                    value={pickers[natKey] ?? role.nationalities ?? []}
                    onChange={(next) => {
                      onPickerChange(natKey, next);
                      saveRoles(roles.map((r) => (r.id === role.id ? { ...r, nationalities: next } : r)));
                    }}
                  />
                  <FieldError id={`merchant-role-${role.id}-nat`} errors={fieldErrors} />
                </div>
                <div data-field={`merchant-role-${role.id}-res`}>
                  <CountrySearchSelect
                    id={`merchant-role-res-${role.id}`}
                    label="Country of residence"
                    required
                    value={role.residence || String(values[`merchant-role-res-${role.id}`] ?? "") || ""}
                    onChange={(v) => {
                      onChange(`merchant-role-res-${role.id}`, v);
                      saveRoles(roles.map((r) => (r.id === role.id ? { ...r, residence: v } : r)));
                    }}
                  />
                  <FieldError id={`merchant-role-${role.id}-res`} errors={fieldErrors} />
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className="btn mb-4"
            onClick={() =>
              saveRoles([...roles, { id: newId("role"), role: "", nationalities: [], residence: "" }])
            }
          >
            Add governing role
          </button>
          <FieldError id="merchant-governing-roles" errors={fieldErrors} />
        </div>
      )}

      <label className="field" data-field="group">
        <span>Is the entity part of a group?</span>
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
        <label className="field" data-field="group-name">
          <span>
            Group name <span className="optional">Optional</span>
          </span>
          <input
            value={String(values["group-name"] ?? "")}
            onChange={(e) => onChange("group-name", e.target.value)}
          />
        </label>
      )}
    </>
  );
}

function PricingStep({ values, onChange, fieldErrors }: Omit<Props, "step" | "pickers" | "onPickerChange">) {
  const markets = parseMarkets(values);
  const future = parseJsonList<FutureMethod>(values["merchant-future-methods"]);

  const methodCurrencyLines: string[] = [];
  for (const m of markets) {
    for (const meth of m.methods ?? []) {
      const mLabel = namedMethodLabel(meth.family, meth.method) || methodFamilyLabel(meth.family);
      for (const c of meth.currencies ?? []) {
        const avg = c.unknown ? null : deriveAverage(c.monthlyValue, c.monthlyCount);
        methodCurrencyLines.push(
          `${m.name || "Market"} · ${mLabel} · ${c.currency || "—"}${
            avg !== null ? ` · avg estimate ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ""
          }`
        );
      }
    }
  }

  function saveFuture(next: FutureMethod[]) {
    onChange("merchant-future-methods", JSON.stringify(next));
  }

  return (
    <>
      <p className="lead">Pricing and additional requirements</p>

      <label className="field" data-field="merchant-target-rate">
        <span>
          Target blended processing rate (%) <span className="optional">Optional</span>
        </span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={String(values["merchant-target-rate"] ?? values["target-rate"] ?? "")}
          onChange={(e) => {
            onChange("merchant-target-rate", e.target.value);
            onChange("target-rate", e.target.value);
          }}
        />
        <small className="hint">Helpful for matching but not required.</small>
      </label>

      <div className="panel mb-4">
        <p className="field-label">Methods and currencies from market schedule</p>
        {methodCurrencyLines.length ? (
          <ul className="hint">
            {methodCurrencyLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="hint">No markets captured yet.</p>
        )}
        <p className="hint">Edit markets on the previous market schedule step to change this list.</p>
      </div>

      <div className="panel mb-4" data-field="merchant-future-methods">
        <p className="field-label">
          Future payment methods <span className="optional">Optional</span>
        </p>
        {future.map((row) => (
          <div key={row.id} className="panel nested-panel mb-3">
            <div className="flex justify-between items-center gap-3 mb-2">
              <h3 className="mt-0 mb-0">Future method</h3>
              <button
                type="button"
                className="mini"
                onClick={() => saveFuture(future.filter((f) => f.id !== row.id))}
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="field">
                <span>Family</span>
                <select
                  value={row.family}
                  onChange={(e) =>
                    saveFuture(
                      future.map((f) =>
                        f.id === row.id ? { ...f, family: e.target.value, method: "" } : f
                      )
                    )
                  }
                >
                  <option value="">Select…</option>
                  {MERCHANT_METHOD_FAMILIES.map((fam) => (
                    <option key={fam.id} value={fam.id}>
                      {fam.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Method</span>
                <select
                  value={row.method}
                  onChange={(e) =>
                    saveFuture(future.map((f) => (f.id === row.id ? { ...f, method: e.target.value } : f)))
                  }
                >
                  <option value="">Select…</option>
                  {namedMethodsForFamily(row.family).map((nm) => (
                    <option key={nm.id} value={nm.id}>
                      {nm.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="checkline">
              <input
                type="checkbox"
                checked={row.notDecided === true}
                onChange={(e) =>
                  saveFuture(
                    future.map((f) =>
                      f.id === row.id
                        ? {
                            ...f,
                            notDecided: e.target.checked,
                            market: e.target.checked ? "" : f.market,
                            currency: e.target.checked ? "" : f.currency,
                          }
                        : f
                    )
                  )
                }
              />
              <span>Not yet decided (market / currency)</span>
            </label>
            {!row.notDecided && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="field">
                  <span>Planned market</span>
                  <input
                    value={row.market ?? ""}
                    onChange={(e) =>
                      saveFuture(future.map((f) => (f.id === row.id ? { ...f, market: e.target.value } : f)))
                    }
                  />
                </label>
                <label className="field">
                  <span>Planned currency</span>
                  <select
                    value={row.currency ?? ""}
                    onChange={(e) =>
                      saveFuture(
                        future.map((f) => (f.id === row.id ? { ...f, currency: e.target.value } : f))
                      )
                    }
                  >
                    <option value="">Select…</option>
                    {MERCHANT_PROCESSING_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <label className="checkline">
              <input
                type="checkbox"
                checked={row.forDiscussion === true}
                onChange={(e) =>
                  saveFuture(
                    future.map((f) => (f.id === row.id ? { ...f, forDiscussion: e.target.checked } : f))
                  )
                }
              />
              <span>For discussion</span>
            </label>
          </div>
        ))}
        <button
          type="button"
          className="btn"
          onClick={() =>
            saveFuture([
              ...future,
              {
                id: newId("future"),
                family: "",
                method: "",
                market: "",
                currency: "",
                notDecided: false,
                forDiscussion: false,
              },
            ])
          }
        >
          Add future payment method
        </button>
        <FieldError id="merchant-future-methods" errors={fieldErrors} />
      </div>
    </>
  );
}

export function MerchantSteps({ step, values, pickers, onChange, onPickerChange, fieldErrors }: Props) {
  if (!isMerchantRoute(values)) return null;

  if (step === 2) {
    return (
      <BusinessActivityStep
        values={values}
        pickers={pickers}
        onChange={onChange}
        onPickerChange={onPickerChange}
        fieldErrors={fieldErrors}
      />
    );
  }

  if (step === 3 && isCombinedBankMerchant(values)) {
    return <BankRequirementsStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  }

  if (step === 4) {
    return (
      <OwnershipStep
        values={values}
        pickers={pickers}
        onChange={onChange}
        onPickerChange={onPickerChange}
        fieldErrors={fieldErrors}
      />
    );
  }

  if (step === 7) {
    return (
      <ChannelsStep
        values={values}
        pickers={pickers}
        onChange={onChange}
        onPickerChange={onPickerChange}
        fieldErrors={fieldErrors}
      />
    );
  }

  if (step === 8) {
    return <MarketSchedule values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  }

  if (step === 9) {
    return <HistoryStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  }

  if (step === 10) {
    return <PricingStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  }

  if (step === 11) {
    return <SettlementStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  }

  return null;
}
