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

/** Only one country multi-select dropdown open at a time (CO03 / shared screening UX). */
let openCountryPickerId: string | null = null;
const openListeners = new Set<(id: string | null) => void>();

function setOpenPicker(id: string | null) {
  openCountryPickerId = id;
  openListeners.forEach((fn) => fn(id));
}

export function CountryMultiSelect({ id, label, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPeer(peerId: string | null) {
      if (peerId !== id) setOpen(false);
    }
    openListeners.add(onPeer);
    return () => {
      openListeners.delete(onPeer);
    };
  }, [id]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (openCountryPickerId === id) setOpenPicker(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        if (openCountryPickerId === id) setOpenPicker(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [id, open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries.slice(0, 80);
    return countries.filter((c) => c.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  function toggle(country: string) {
    if (value.includes(country)) onChange(value.filter((c) => c !== country));
    else onChange([...value, country].sort());
  }

  function openDropdown() {
    setOpenPicker(id);
    setOpen(true);
  }

  function done() {
    setOpen(false);
    if (openCountryPickerId === id) setOpenPicker(null);
    setSearch("");
  }

  return (
    <div className="field country-search" ref={rootRef} data-field={id}>
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
        onFocus={openDropdown}
        onChange={(e) => {
          setSearch(e.target.value);
          openDropdown();
        }}
        aria-label={`Search countries for ${label}`}
        autoComplete="off"
      />
      {open && (
        <div className="country-dropdown-panel">
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
                  {value.includes(country) ? "✓ " : ""}
                  {country}
                </button>
              </li>
            ))}
          </ul>
          <div className="country-dropdown-actions">
            <button type="button" className="btn mini" onClick={done}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
