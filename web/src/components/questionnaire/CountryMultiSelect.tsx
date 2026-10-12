"use client";

import { useMemo, useState } from "react";
import countries from "@/data/countries.json";

type Props = {
  id: string;
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
};

export function CountryMultiSelect({ id, label, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.toLowerCase().includes(q));
  }, [search]);

  function toggle(country: string) {
    if (value.includes(country)) onChange(value.filter((c) => c !== country));
    else onChange([...value, country].sort());
  }

  return (
    <div className="field">
      <span>
        {label}
        {!required && <small> (optional)</small>}
      </span>
      <div className="chips" aria-live="polite">
        {value.map((c) => (
          <button key={c} type="button" className="chip" onClick={() => toggle(c)}>
            {c} ×
          </button>
        ))}
        {!value.length && <span className="hint">No countries selected.</span>}
      </div>
      <details className="picker" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary>Select countries</summary>
        <div className="popover">
          <input
            id={`${id}-search`}
            type="search"
            placeholder="Search countries"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={`Search countries for ${label}`}
          />
          <div className="country-options">
            {filtered.map((country) => (
              <label key={country}>
                <input
                  type="checkbox"
                  checked={value.includes(country)}
                  onChange={() => toggle(country)}
                />
                {country}
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
