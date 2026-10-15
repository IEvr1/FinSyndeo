"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import countries from "@/data/countries.json";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
};

export function CountrySearchSelect({ id, label, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries.slice(0, 80);
    return countries.filter((c) => c.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="field country-search" ref={rootRef}>
      <span>
        {label}
        {!required && <small> (optional)</small>}
      </span>
      {value && (
        <div className="chips">
          <button type="button" className="chip" onClick={() => onChange("")}>
            {value} ×
          </button>
        </div>
      )}
      <input
        id={id}
        type="search"
        placeholder="Search countries…"
        value={open ? search : value || search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        autoComplete="off"
      />
      {open && (
        <ul id={`${id}-list`} className="country-dropdown" role="listbox">
          {filtered.map((country) => (
            <li key={country}>
              <button
                type="button"
                role="option"
                aria-selected={value === country}
                onClick={() => {
                  onChange(country);
                  setSearch("");
                  setOpen(false);
                }}
              >
                {country}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
