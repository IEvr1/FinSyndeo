"use client";

import { APPLICANT_ONBOARDING_METHODS, onboardingStorageKey } from "@/lib/onboarding-methods";
import type { FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

const LANGS = ["English", "Greek", "French", "German", "Spanish", "Italian", "Hebrew", "Arabic", "Other"];

type Props = {
  values: QuestionnaireValues;
  onChange: (id: string, value: FieldValue) => void;
};

export function OnboardingPreferencesPanel({ values, onChange }: Props) {
  const noPref = values["onboarding-no-preference"] === true;

  return (
    <section className="panel">
      <h2>Onboarding preferences</h2>
      <p className="hint">Which onboarding methods are acceptable to you? Select all that apply.</p>
      <fieldset>
        <legend className="sr-only">Onboarding methods</legend>
        <div className="checks">
          {APPLICANT_ONBOARDING_METHODS.filter((m) => m !== "No preference").map((method) => (
            <label key={method}>
              <input
                type="checkbox"
                disabled={noPref}
                checked={values[onboardingStorageKey(method)] === true}
                onChange={(e) => onChange(onboardingStorageKey(method), e.target.checked)}
              />
              {method}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={noPref}
              onChange={(e) => {
                onChange("onboarding-no-preference", e.target.checked);
                if (e.target.checked) {
                  APPLICANT_ONBOARDING_METHODS.forEach((m) => {
                    if (m !== "No preference") onChange(onboardingStorageKey(m), false);
                  });
                }
              }}
            />
            No preference
          </label>
        </div>
      </fieldset>
      <label className="field">
        <span>Preferred relationship-manager language (optional)</span>
        <select
          value={String(values["relationship-manager-language"] ?? "")}
          onChange={(e) => onChange("relationship-manager-language", e.target.value)}
        >
          <option value="">Not specified</option>
          {LANGS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </label>
      {values["relationship-manager-language"] && (
        <label className="field">
          <span>Language requirement</span>
          <select
            value={String(values["relationship-manager-language-level"] ?? "preferred")}
            onChange={(e) => onChange("relationship-manager-language-level", e.target.value)}
          >
            <option value="preferred">Preferred</option>
            <option value="required">Required</option>
          </select>
        </label>
      )}
    </section>
  );
}
