"use client";

import type { QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  values: QuestionnaireValues;
  onChange: (key: string, value: string) => void;
  /** FN01: hide on financing steps so applicants cannot relabel route mid-flow. */
  hideChangeApplicantType?: boolean;
};

const APPLICANT_TYPES = [
  {
    value: "individual",
    title: "Individual",
    description: "Private banking",
  },
  {
    value: "company",
    title: "Legal entity",
    description: "Business banking, merchant services or financing",
  },
  {
    value: "institution",
    title: "Financial institution",
    description: "Correspondent / payment accounts",
  },
] as const;

const LEGAL_ENTITY_SERVICES = [
  { value: "bank", label: "Business bank account" },
  { value: "merchant", label: "Merchant account" },
  { value: "both", label: "Both bank and merchant accounts" },
  { value: "financing", label: "Financing" },
] as const;

export function ApplicantRouteSelector({ values, onChange, hideChangeApplicantType }: Props) {
  const applicant = String(values.applicant ?? "");
  const accountType = String(values["account-type"] ?? "");
  // FN01: never show Change applicant type on the financing route.
  const hideChange = hideChangeApplicantType || accountType === "financing";

  return (
    <div className="applicant-route-select">
      <p className="field-label">Who is this assessment for?</p>
      <div className="service-card-grid">
        {APPLICANT_TYPES.map((t) => (
          <label key={t.value} className="service-card">
            <input
              type="radio"
              name="applicant-type"
              value={t.value}
              checked={applicant === t.value}
              onChange={() => {
                onChange("applicant", t.value);
                if (t.value === "individual") {
                  onChange("account-type", "bank");
                }
              }}
            />
            <span className="service-card-title">{t.title}</span>
            <span className="service-card-desc">{t.description}</span>
          </label>
        ))}
      </div>

      {applicant === "company" && (
        <>
          <p className="field-label mt-6">What do you need?</p>
          <div className="service-card-grid">
            {LEGAL_ENTITY_SERVICES.map((s) => (
              <label key={s.value} className="service-card">
                <input
                  type="radio"
                  name="account-type"
                  value={s.value}
                  checked={accountType === s.value}
                  onChange={() => {
                    onChange("account-type", s.value);
                    if (s.value === "both") {
                      onChange("bank-entry", "start");
                      onChange("find-bank", "Yes");
                    }
                    if (s.value === "merchant") {
                      onChange("find-bank", "No");
                      onChange("bank-entry", "");
                    }
                  }}
                />
                <span className="service-card-title">{s.label}</span>
              </label>
            ))}
          </div>
          {accountType === "both" && (
            <p className="hint mt-3" data-field="service-scope-summary">
              Selected services: Bank account + Merchant account
            </p>
          )}
        </>
      )}

      {applicant && !hideChange && (
        <p className="text-sm text-[var(--muted)] mt-4">
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              onChange("applicant", "");
              onChange("account-type", "");
            }}
          >
            Change applicant type
          </button>
        </p>
      )}
    </div>
  );
}
