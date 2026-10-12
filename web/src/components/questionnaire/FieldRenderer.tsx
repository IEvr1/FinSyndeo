"use client";

import countries from "@/data/countries.json";
import { fieldStorageKey } from "@/lib/questionnaire/dictionary";
import type { ApplicantField, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  field: ApplicantField;
  values: QuestionnaireValues;
  onChange: (key: string, value: FieldValue) => void;
  step?: number;
};

export function FieldRenderer({ field, values, onChange, step }: Props) {
  const key = fieldStorageKey(field);
  const raw = values[key];
  const str = typeof raw === "string" ? raw : raw === true ? "Yes" : "";

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
    const opts = field.choices ?? [];
    return (
      <label className="field">
        <span>
          {field.label}
          {!field.required && <small> (optional)</small>}
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
          {!field.required && <small> (optional)</small>}
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
        {!field.required && <small> (optional)</small>}
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
