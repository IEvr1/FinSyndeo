"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries.slice(0, 80);
    return countries.filter((c) => c.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  function toggle(country: string) {
    if (value.includes(country)) onChange(value.filter((c) => c !== country));
    else onChange([...value, country].sort());
  }

  return (
    <div className="field country-search" ref={rootRef}>
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
      <input
        id={`${id}-search`}
        type="search"
        placeholder="Search and add countries…"
        value={search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        aria-label={`Search countries for ${label}`}
        autoComplete="off"
      />
      {open && (
        <ul className="country-dropdown" role="listbox">
          {filtered.map((country) => (
            <li key={country}>
              <button
                type="button"
                role="option"
                aria-selected={value.includes(country)}
                onClick={() => {
                  toggle(country);
                  setSearch("");
                }}
              >
                {value.includes(country) ? "✓ " : ""}{country}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
