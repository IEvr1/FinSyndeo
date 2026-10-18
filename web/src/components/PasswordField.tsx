"use client";

import { useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
  required?: boolean;
  id?: string;
  showHint?: boolean;
  name?: string;
};

export const PASSWORD_RULE_HINT =
  "At least 8 characters with uppercase, lowercase, a number and a symbol. Password managers and pasting are allowed.";

/** Shared password input: show/hide, no truncation, paste and password managers permitted. */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  required = true,
  id,
  showHint = false,
  name,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <div className="flex gap-2 items-center">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn mini" onClick={() => setVisible((v) => !v)}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showHint && <small>{PASSWORD_RULE_HINT}</small>}
    </label>
  );
}
