"use client";

import {
  FINANCE_AUDIT_AVAILABILITY,
  FINANCE_BUSINESS_STAGE_PURPOSES,
  FINANCE_BUSINESS_STAGES,
  FINANCE_CURRENCIES,
  FINANCE_CURRENCY_CLARIFICATION,
  FINANCE_PLEDGE_STATUS,
  FINANCE_PROJECT_STAGE_PURPOSES,
  FINANCE_PROJECT_STAGES,
  FINANCE_PURPOSES,
  FINANCE_REVENUE_STATUS,
  FINANCE_TIMELINES,
  auditYearKey,
  completedFinancialYears,
  facilityKey,
  financePurposeKey,
} from "@/lib/questionnaire/financing-config";
import type { FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  step: number;
  values: QuestionnaireValues;
  onChange: (key: string, value: FieldValue) => void;
  fieldErrors?: Record<string, string>;
};

function FieldError({ id, errors }: { id: string; errors?: Record<string, string> }) {
  const msg = errors?.[id];
  if (!msg) return null;
  return (
    <p className="field-error" id={`${id}-error`} role="alert" data-field={id}>
      {msg}
    </p>
  );
}

function yearOptions() {
  return completedFinancialYears();
}

function NeedStep({ values, onChange, fieldErrors }: Omit<Props, "step">) {
  const purposeKey = financePurposeKey(String(values["finance-purpose"] ?? ""));
  const timeline = String(values["finance-timeline"] ?? "");
  const termUnknown = values["finance-term-unknown"] === true;
  const purposeMeta = FINANCE_PURPOSES.find((p) => p.key === purposeKey);

  return (
    <>
      <label className="field" data-field="finance-purpose">
        <span>What is the purpose of the financing?</span>
        <select
          id="finance-purpose"
          value={purposeKey}
          onChange={(e) => {
            onChange("finance-purpose", e.target.value);
            if (e.target.value !== "other") onChange("finance-other-text", "");
          }}
        >
          <option value="">Select…</option>
          {FINANCE_PURPOSES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        {purposeMeta && "helper" in purposeMeta && purposeMeta.helper ? (
          <small className="hint">{purposeMeta.helper}</small>
        ) : null}
      </label>
      <FieldError id="finance-purpose" errors={fieldErrors} />

      {purposeKey === "other" && (
        <>
          <label className="field" data-field="finance-other-text">
            <span>Please explain the purpose</span>
            <textarea
              id="finance-other-text"
              value={String(values["finance-other-text"] ?? "")}
              onChange={(e) => onChange("finance-other-text", e.target.value)}
            />
          </label>
          <FieldError id="finance-other-text" errors={fieldErrors} />
        </>
      )}

      <div className="grid">
        <label className="field" data-field="finance-amount">
          <span>Amount sought</span>
          <input
            id="finance-amount"
            type="number"
            min={0.01}
            step="0.01"
            value={String(values["finance-amount"] ?? "")}
            onChange={(e) => onChange("finance-amount", e.target.value)}
          />
        </label>
        <label className="field" data-field="finance-currency">
          <span>Financing currency</span>
          <select
            id="finance-currency"
            value={String(values["finance-currency"] ?? "")}
            onChange={(e) => onChange("finance-currency", e.target.value)}
          >
            <option value="">Select…</option>
            {FINANCE_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FieldError id="finance-amount" errors={fieldErrors} />
      <FieldError id="finance-currency" errors={fieldErrors} />

      <label className="field" data-field="finance-use">
        <span>How will the funds be used?</span>
        <textarea
          id="finance-use"
          placeholder={
            purposeKey === "maritime_vessel_finance"
              ? "e.g. purchasing a cargo vessel for contracted freight services"
              : "Briefly describe the intended use of funds"
          }
          value={String(values["finance-use"] ?? "")}
          onChange={(e) => onChange("finance-use", e.target.value)}
        />
      </label>
      <FieldError id="finance-use" errors={fieldErrors} />

      <label className="field" data-field="finance-timeline">
        <span>When do you need the financing?</span>
        <select
          id="finance-timeline"
          value={timeline}
          onChange={(e) => {
            onChange("finance-timeline", e.target.value);
            if (e.target.value !== "specific_date") onChange("finance-date", "");
          }}
        >
          <option value="">Select…</option>
          {FINANCE_TIMELINES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <FieldError id="finance-timeline" errors={fieldErrors} />

      {timeline === "specific_date" && (
        <>
          <label className="field" data-field="finance-date">
            <span>Required date</span>
            <input
              id="finance-date"
              type="date"
              value={String(values["finance-date"] ?? "")}
              onChange={(e) => onChange("finance-date", e.target.value)}
            />
          </label>
          <FieldError id="finance-date" errors={fieldErrors} />
        </>
      )}

      <fieldset className="field" data-field="finance-term">
        <legend>Preferred repayment term in years</legend>
        <label className="checkline">
          <input
            type="checkbox"
            checked={termUnknown}
            onChange={(e) => {
              onChange("finance-term-unknown", e.target.checked);
              if (e.target.checked) onChange("finance-term", "");
            }}
          />
          <span>I am not yet sure of the repayment term</span>
        </label>
        {!termUnknown && (
          <input
            id="finance-term"
            type="number"
            min={0.25}
            step="0.25"
            value={String(values["finance-term"] ?? "")}
            onChange={(e) => onChange("finance-term", e.target.value)}
          />
        )}
        <p className="hint">Availability remains subject to lender assessment.</p>
      </fieldset>
      <FieldError id="finance-term" errors={fieldErrors} />
    </>
  );
}

function ProjectFinancialsStep({ values, onChange, fieldErrors }: Omit<Props, "step">) {
  const purposeKey = financePurposeKey(String(values["finance-purpose"] ?? ""));
  const revenueStatus = String(values["finance-revenue-status"] ?? "");
  const audited = String(values["finance-audited"] ?? "");
  const years = yearOptions();

  const stageLabel = FINANCE_BUSINESS_STAGE_PURPOSES.has(purposeKey)
    ? "Business stage"
    : purposeKey === "maritime_vessel_finance"
      ? "Vessel purchase or maritime project stage"
      : purposeKey === "business_acquisition"
        ? "Acquisition stage"
        : FINANCE_PROJECT_STAGE_PURPOSES.has(purposeKey)
          ? "Project / investment stage"
          : "Business or project stage";

  const stages =
    FINANCE_BUSINESS_STAGE_PURPOSES.has(purposeKey) || purposeKey === "other" || !purposeKey
      ? FINANCE_BUSINESS_STAGES
      : FINANCE_PROJECT_STAGES;

  const showLocation =
    FINANCE_PROJECT_STAGE_PURPOSES.has(purposeKey) || purposeKey === "maritime_vessel_finance";

  return (
    <>
      <label className="field" data-field="finance-stage">
        <span>{stageLabel}</span>
        <select
          id="finance-stage"
          value={String(values["finance-stage"] ?? "")}
          onChange={(e) => onChange("finance-stage", e.target.value)}
        >
          <option value="">Select…</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="hint">Business stage does not prove revenue status.</p>
      </label>
      <FieldError id="finance-stage" errors={fieldErrors} />

      {showLocation && (
        <>
          <label className="field" data-field="finance-project-country">
            <span>Project / asset location</span>
            <input
              id="finance-project-country"
              value={String(values["finance-project-country"] ?? "")}
              onChange={(e) => onChange("finance-project-country", e.target.value)}
            />
          </label>
          <FieldError id="finance-project-country" errors={fieldErrors} />
        </>
      )}

      {purposeKey === "maritime_vessel_finance" && (
        <label className="field" data-field="finance-vessel-details">
          <span>Vessel / investment details</span>
          <textarea
            id="finance-vessel-details"
            placeholder="e.g. vessel type, purchase/refit, intended use, proposed owner"
            value={String(values["finance-vessel-details"] ?? "")}
            onChange={(e) => onChange("finance-vessel-details", e.target.value)}
          />
        </label>
      )}

      <label className="field" data-field="finance-project">
        <span>Brief project or business update</span>
        <textarea
          id="finance-project"
          value={String(values["finance-project"] ?? "")}
          onChange={(e) => onChange("finance-project", e.target.value)}
        />
      </label>

      <h2 className="mt-6">Financial information</h2>

      <label className="field" data-field="finance-revenue-status">
        <span>Revenue status</span>
        <select
          id="finance-revenue-status"
          value={revenueStatus}
          onChange={(e) => {
            onChange("finance-revenue-status", e.target.value);
            if (e.target.value !== "Generating revenue") {
              /* keep optional figures; do not invent turnover */
            }
          }}
        >
          <option value="">Select…</option>
          {FINANCE_REVENUE_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <FieldError id="finance-revenue-status" errors={fieldErrors} />

      <label className="field" data-field="finance-report-currency">
        <span>Financial reporting currency</span>
        <select
          id="finance-report-currency"
          value={String(values["finance-report-currency"] ?? "")}
          onChange={(e) => onChange("finance-report-currency", e.target.value)}
        >
          <option value="">Select…</option>
          {FINANCE_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={FINANCE_CURRENCY_CLARIFICATION}>{FINANCE_CURRENCY_CLARIFICATION}</option>
        </select>
        <p className="hint">
          If the real reporting currency differs from EUR/GBP/USD, select Needs clarification. Figures are not
          converted.
        </p>
      </label>
      <FieldError id="finance-report-currency" errors={fieldErrors} />

      {revenueStatus === "Generating revenue" && (
        <>
          <label className="field" data-field="finance-revenue">
            <span>Latest annual revenue / turnover</span>
            <input
              id="finance-revenue"
              type="number"
              min={0}
              step="0.01"
              value={String(values["finance-revenue"] ?? "")}
              onChange={(e) => onChange("finance-revenue", e.target.value)}
            />
            <p className="hint">
              Total sales or operating revenue before expenses, not profit; use the latest completed financial year.
            </p>
          </label>
          <FieldError id="finance-revenue" errors={fieldErrors} />
          {String(values["finance-revenue"] ?? "").trim() !== "" && (
            <>
              <label className="field" data-field="finance-revenue-year">
                <span>Financial year for this revenue</span>
                <select
                  id="finance-revenue-year"
                  value={String(values["finance-revenue-year"] ?? "")}
                  onChange={(e) => onChange("finance-revenue-year", e.target.value)}
                >
                  <option value="">Select year</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <FieldError id="finance-revenue-year" errors={fieldErrors} />
            </>
          )}
        </>
      )}

      <label className="field" data-field="finance-profit">
        <span>Profit or loss for the same financial year</span>
        <input
          id="finance-profit"
          type="number"
          step="0.01"
          value={String(values["finance-profit"] ?? "")}
          onChange={(e) => onChange("finance-profit", e.target.value)}
        />
        <p className="hint">Positive profit, zero and negative loss are all allowed. Optional.</p>
      </label>
      <FieldError id="finance-profit" errors={fieldErrors} />

      <label className="field" data-field="finance-audited">
        <span>Could audited financial statements be provided if requested by a lender?</span>
        <select
          id="finance-audited"
          value={audited}
          onChange={(e) => {
            onChange("finance-audited", e.target.value);
            if (e.target.value !== "Yes") {
              for (const y of years) onChange(auditYearKey(y), false);
            }
          }}
        >
          <option value="">Select…</option>
          {FINANCE_AUDIT_AVAILABILITY.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="hint">This records availability only; no statements are uploaded now.</p>
      </label>
      <FieldError id="finance-audited" errors={fieldErrors} />

      {audited === "Yes" && (
        <fieldset className="field" data-field="finance-audit-years">
          <legend>Available audited financial years</legend>
          <p className="hint mb-2">Select at least one of the last five completed financial years.</p>
          <div className="checks" style={{ display: "grid", gap: "0.75rem" }}>
            {years.map((y) => (
              <label key={y} className="checkline">
                <input
                  type="checkbox"
                  checked={values[auditYearKey(y)] === true}
                  onChange={(e) => onChange(auditYearKey(y), e.target.checked)}
                />
                <span>{y}</span>
              </label>
            ))}
          </div>
          <FieldError id="finance-audit-years" errors={fieldErrors} />
        </fieldset>
      )}
    </>
  );
}

function FacilitiesSecurityStep({ values, onChange, fieldErrors }: Omit<Props, "step">) {
  const existing = String(values["finance-existing"] ?? "");
  const security = String(values["finance-security"] ?? "");
  const purposeKey = financePurposeKey(String(values["finance-purpose"] ?? ""));
  const count = Math.max(1, Number(values["finance-facility-count"] ?? 1) || 1);

  return (
    <>
      <label className="field" data-field="finance-existing">
        <span>Does the company have existing financing?</span>
        <select
          id="finance-existing"
          value={existing}
          onChange={(e) => onChange("finance-existing", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </label>
      <FieldError id="finance-existing" errors={fieldErrors} />

      {existing === "Yes" && (
        <div className="finance-facilities">
          <p className="field-label">Existing facilities</p>
          <FieldError id="finance-facilities" errors={fieldErrors} />
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="panel finance-facility-card" data-field={facilityKey(i, "lender")}>
              <h3 className="text-base font-medium mb-3">Facility {i + 1}</h3>
              <div className="grid">
                <label className="field">
                  <span>Lender</span>
                  <input
                    value={String(values[facilityKey(i, "lender")] ?? "")}
                    onChange={(e) => onChange(facilityKey(i, "lender"), e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Financing type</span>
                  <input
                    value={String(values[facilityKey(i, "type")] ?? "")}
                    onChange={(e) => onChange(facilityKey(i, "type"), e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Outstanding amount</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(values[facilityKey(i, "amount")] ?? "")}
                    onChange={(e) => onChange(facilityKey(i, "amount"), e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Currency</span>
                  <select
                    value={String(values[facilityKey(i, "currency")] ?? "")}
                    onChange={(e) => onChange(facilityKey(i, "currency"), e.target.value)}
                  >
                    <option value="">Select…</option>
                    {FINANCE_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <FieldError id={facilityKey(i, "lender")} errors={fieldErrors} />
              <FieldError id={facilityKey(i, "type")} errors={fieldErrors} />
              <FieldError id={facilityKey(i, "amount")} errors={fieldErrors} />
              <FieldError id={facilityKey(i, "currency")} errors={fieldErrors} />
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={values[facilityKey(i, "maturity-unknown")] === true}
                  onChange={(e) => {
                    onChange(facilityKey(i, "maturity-unknown"), e.target.checked);
                    if (e.target.checked) onChange(facilityKey(i, "maturity"), "");
                  }}
                />
                <span>Maturity unknown</span>
              </label>
              {values[facilityKey(i, "maturity-unknown")] !== true && (
                <label className="field" data-field={facilityKey(i, "maturity")}>
                  <span>Maturity</span>
                  <input
                    type="date"
                    value={String(values[facilityKey(i, "maturity")] ?? "")}
                    onChange={(e) => onChange(facilityKey(i, "maturity"), e.target.value)}
                  />
                </label>
              )}
              <FieldError id={facilityKey(i, "maturity")} errors={fieldErrors} />
            </div>
          ))}
          <div className="flex flex-wrap gap-3 mt-3">
            <button
              type="button"
              className="btn"
              onClick={() => onChange("finance-facility-count", String(count + 1))}
            >
              Add facility
            </button>
            {count > 1 && (
              <button
                type="button"
                className="btn"
                onClick={() => onChange("finance-facility-count", String(count - 1))}
              >
                Remove last facility
              </button>
            )}
          </div>

          {purposeKey === "refinancing" && (
            <label className="field mt-4" data-field="finance-refinance">
              <span>Which facilities would be refinanced, if any?</span>
              <textarea
                id="finance-refinance"
                value={String(values["finance-refinance"] ?? "")}
                onChange={(e) => onChange("finance-refinance", e.target.value)}
                placeholder="Select or describe targets from the facilities declared above"
              />
            </label>
          )}
        </div>
      )}

      <label className="field mt-6" data-field="finance-security">
        <span>Are guarantees or assets available to support the financing?</span>
        <select
          id="finance-security"
          value={security}
          onChange={(e) => onChange("finance-security", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        <p className="hint">No security is not confirmed lender acceptance of unsecured financing.</p>
      </label>
      <FieldError id="finance-security" errors={fieldErrors} />

      {security === "Yes" && (
        <>
          <label className="field" data-field="finance-security-details">
            <span>Describe the assets or guarantees and who owns or provides them</span>
            <textarea
              id="finance-security-details"
              placeholder="e.g. applicant-owned property/vessel or a group-company guarantee"
              value={String(values["finance-security-details"] ?? "")}
              onChange={(e) => onChange("finance-security-details", e.target.value)}
            />
            <p className="hint">Stated estimate only — not an approved valuation or proof of ownership.</p>
          </label>
          <FieldError id="finance-security-details" errors={fieldErrors} />

          <div className="grid">
            <label className="field" data-field="finance-security-value">
              <span>Estimated value</span>
              <input
                id="finance-security-value"
                type="number"
                min={0}
                step="0.01"
                value={String(values["finance-security-value"] ?? "")}
                onChange={(e) => onChange("finance-security-value", e.target.value)}
              />
            </label>
            <label className="field" data-field="finance-security-currency">
              <span>Valuation currency</span>
              <select
                id="finance-security-currency"
                value={String(values["finance-security-currency"] ?? "")}
                onChange={(e) => onChange("finance-security-currency", e.target.value)}
              >
                <option value="">Select…</option>
                {FINANCE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={FINANCE_CURRENCY_CLARIFICATION}>{FINANCE_CURRENCY_CLARIFICATION}</option>
              </select>
            </label>
          </div>
          <FieldError id="finance-security-value" errors={fieldErrors} />
          <FieldError id="finance-security-currency" errors={fieldErrors} />

          <label className="field" data-field="finance-pledged">
            <span>Are these assets already pledged or committed as security?</span>
            <select
              id="finance-pledged"
              value={String(values["finance-pledged"] ?? "")}
              onChange={(e) => onChange("finance-pledged", e.target.value)}
            >
              <option value="">Select…</option>
              {FINANCE_PLEDGE_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <FieldError id="finance-pledged" errors={fieldErrors} />
        </>
      )}
    </>
  );
}

export function FinancingSteps({ step, values, onChange, fieldErrors }: Props) {
  if (step === 12) return <NeedStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  if (step === 13) return <ProjectFinancialsStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  if (step === 14) return <FacilitiesSecurityStep values={values} onChange={onChange} fieldErrors={fieldErrors} />;
  return null;
}
