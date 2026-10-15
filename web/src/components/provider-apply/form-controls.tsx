"use client";

import { PROVIDER_COUNTRIES, STATUS_OPTIONS } from "@/lib/provider-apply/config";
import { axesForFamily } from "@/lib/provider-apply/geo";

export function FieldSelect({
  label,
  value,
  options,
  required,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string] | string>;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  const rows = options.map((o) => (Array.isArray(o) ? o : [o, o]));
  return (
    <label className="field">
      <span>
        {label}
        {!required && <small> (optional)</small>}
      </span>
      <select value={value} required={required} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {rows.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FieldInput({
  label,
  value,
  type = "text",
  required,
  hint,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {!required && <small> (optional)</small>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function FieldTextarea({
  label,
  value,
  required,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {!required && <small> (optional)</small>}
      </span>
      <textarea
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function CheckGroup({
  legend,
  options,
  values,
  onToggle,
}: {
  legend: string;
  options: string[];
  values: string[];
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="checks">
        {options.map((opt) => (
          <label key={opt}>
            <input
              type="checkbox"
              checked={values.includes(opt)}
              onChange={(e) => onToggle(opt, e.target.checked)}
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function StatusMatrix({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: string[];
  values: Record<number, string>;
  onChange: (index: number, status: string) => void;
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {options.map((label, i) => (
        <div key={label} className="status-row">
          <span>{label}</span>
          <select
            aria-label={`${label} acceptance`}
            value={values[i] ?? "unknown"}
            onChange={(e) => onChange(i, e.target.value)}
          >
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      ))}
    </section>
  );
}

export function GeoAxisEditor({
  family,
  offerId,
  geo,
  axis,
  onAxis,
  onUpdate,
}: {
  family: string;
  offerId: string;
  geo: Record<string, { default: string; exceptions: Record<string, string> }>;
  axis: string;
  onAxis: (axis: string) => void;
  onUpdate: (next: Record<string, { default: string; exceptions: Record<string, string> }>) => void;
}) {
  const axes = axesForFamily(family);
  const rule = geo[axis] ?? { default: "unknown", exceptions: {} };

  function setDefault(value: string) {
    onUpdate({ ...geo, [axis]: { ...rule, default: value } });
  }

  function setException(country: string, value: string) {
    onUpdate({
      ...geo,
      [axis]: { ...rule, exceptions: { ...rule.exceptions, [country]: value } },
    });
  }

  return (
    <section className="panel">
      <h2>Country acceptance</h2>
      <p className="hint">
        Choose the country dimension, set a default policy, then add country exceptions.
      </p>
      <FieldSelect
        label="Country criteria"
        value={axis}
        options={axes.map(([id, label]) => [id, label])}
        onChange={onAxis}
      />
      <FieldSelect
        label="Default policy for countries not listed below"
        value={rule.default}
        options={STATUS_OPTIONS}
        onChange={setDefault}
      />
      <details className="picker">
        <summary>Add country exceptions</summary>
        <div className="popover country-options">
          {PROVIDER_COUNTRIES.slice(0, 120).map((country) => (
            <div key={`${offerId}-${axis}-${country}`} className="status-row">
              <span>{country}</span>
              <select
                value={rule.exceptions[country] ?? ""}
                onChange={(e) => setException(country, e.target.value || rule.default)}
              >
                <option value="">Default ({rule.default})</option>
                {STATUS_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <p className="hint">Search the full country list in the revised country-policy editor when connected.</p>
        </div>
      </details>
    </section>
  );
}
