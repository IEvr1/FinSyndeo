"use client";

import countries from "@/data/countries.json";
import { FINANCE_ENTITY_TYPES } from "@/lib/questionnaire/financing-config";
import { MERCHANT_ENTITY_TYPES, MERCHANT_CONTACT_CAPACITIES } from "@/lib/questionnaire/merchant-config";
import { fieldStorageKey } from "@/lib/questionnaire/dictionary";
import type { ApplicantField, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  field: ApplicantField;
  values: QuestionnaireValues;
  onChange: (key: string, value: FieldValue) => void;
  step?: number;
  /** When true, omit repeated "(optional)" markers (FN15 financing). */
  hideOptionalMarker?: boolean;
};

function isFinancing(values: QuestionnaireValues): boolean {
  return String(values.applicant ?? "") === "company" && String(values["account-type"] ?? "") === "financing";
}

function isMerchant(values: QuestionnaireValues): boolean {
  const accountType = String(values["account-type"] ?? "");
  return (
    String(values.applicant ?? "") === "company" && (accountType === "merchant" || accountType === "both")
  );
}

export function FieldRenderer({ field, values, onChange, step, hideOptionalMarker }: Props) {
  const key = fieldStorageKey(field);
  const raw = values[key];
  const str = typeof raw === "string" ? raw : raw === true ? "Yes" : "";
  const financing = isFinancing(values);
  const showOptional = !field.required && !hideOptionalMarker && !financing;

  if (field.type === "checkbox") {
    const checked = raw === true;
    return (
      <label className="checkline">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            onChange(key, e.target.checked);
            if (step === 3 && field.label && e.target.checked) {
              onChange(`purpose:${field.label}`, true);
            }
          }}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "select-one") {
    let opts = field.choices ?? [];
    const merchant = isMerchant(values);
    if (merchant && field.id === "entity-type") {
      const allowed = new Set<string>(["", ...MERCHANT_ENTITY_TYPES]);
      opts = opts.filter((o) => allowed.has(o.value) || allowed.has(o.label));
      const unsupported = Boolean(str && !allowed.has(str));
      return (
        <label className="field" data-field="entity-type">
          <span>{field.label}</span>
          <select
            value={str}
            required={field.required}
            onChange={(e) => onChange(key, e.target.value)}
          >
            {unsupported && (
              <option value={str}>
                {str} (outside merchant scope — needs review)
              </option>
            )}
            {opts.map((o) => (
              <option key={`${key}-${o.value}`} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {unsupported && (
            <p className="hint" role="alert">
              Merchant applications currently support Private limited company and Association only. This draft
              entity type is preserved and flagged for scope review; it will not be silently relabelled.
            </p>
          )}
        </label>
      );
    }
    if (merchant && field.id === "representative-role") {
      opts = MERCHANT_CONTACT_CAPACITIES.map((c) => ({ value: c, label: c }));
    }
    if (financing && field.id === "entity-type") {
      const allowed = new Set<string>(["", ...FINANCE_ENTITY_TYPES]);
      opts = opts.filter((o) => allowed.has(o.value) || allowed.has(o.label));
      const unsupported = str && !allowed.has(str);
      return (
        <label className="field" data-field="entity-type">
          <span>{field.label}</span>
          <select
            value={unsupported ? str : str}
            required={field.required}
            onChange={(e) => onChange(key, e.target.value)}
          >
            {unsupported && (
              <option value={str}>
                {str} (outside financing scope)
              </option>
            )}
            {opts.map((o) => (
              <option key={`${key}-${o.value}`} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {unsupported && (
            <p className="hint" role="alert">
              This financing route supports only private limited companies, partnerships and LLPs. This draft is
              outside its current scope and cannot be relabelled to proceed.
            </p>
          )}
        </label>
      );
    }
    if (financing && field.id === "representative-role") {
      const hasPartner = opts.some((o) => o.value.includes("Partner"));
      if (!hasPartner) {
        opts = [
          ...opts.slice(0, 4),
          { value: "Partner / member", label: "Partner / member" },
          ...opts.slice(4),
        ];
      }
    }
    let selectLabel = field.label;
    if (financing && field.id === "corporate") {
      const entity = String(values["entity-type"] ?? "");
      selectLabel =
        entity.includes("Partnership") || entity.includes("LLP")
          ? "Are any partners or members legal entities?"
          : "Are any direct shareholders legal entities?";
    }
    if (financing && field.id === "group") {
      selectLabel = "Is the entity part of a group?";
    }
    return (
      <label className="field">
        <span>
          {selectLabel}
          {showOptional && <small> (optional)</small>}
        </span>
        <select
          value={str}
          required={field.required}
          onChange={(e) => onChange(key, e.target.value)}
        >
          {opts.map((o) => (
            <option key={`${key}-${o.value}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="field">
        <span>
          {field.label}
          {showOptional && <small> (optional)</small>}
        </span>
        <textarea
          value={str}
          required={field.required}
          onChange={(e) => onChange(key, e.target.value)}
        />
      </label>
    );
  }

  const inputType =
    field.type === "email" || field.type === "url" || field.type === "tel" || field.type === "date" || field.type === "number"
      ? field.type
      : "text";

  const useCountryList =
    field.label.toLowerCase().includes("country") ||
    field.label.toLowerCase().includes("jurisdiction") ||
    field.id === "incorporation" ||
    field.id === "pb-residence";

  return (
    <label className="field">
      <span>
        {field.label}
        {showOptional && <small> (optional)</small>}
      </span>
      <input
        type={inputType}
        list={useCountryList ? `${key}-countries` : undefined}
        value={str}
        required={field.required}
        onChange={(e) => onChange(key, e.target.value)}
      />
      {useCountryList && (
        <datalist id={`${key}-countries`}>
          {countries.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      )}
    </label>
  );
}

type RadioGroupProps = {
  name: string;
  legend: string;
  options: ApplicantField[];
  values: QuestionnaireValues;
  onChange: (key: string, value: FieldValue) => void;
  required?: boolean;
};

export function RadioGroupField({ name, legend, options, values, onChange, required }: RadioGroupProps) {
  const selected = String(values[name] ?? "");
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="checks">
        {options.map((opt) => (
          <label key={opt.key}>
            <input
              type="radio"
              name={name}
              checked={selected === opt.label}
              onChange={() => onChange(name, opt.label)}
              required={required}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
