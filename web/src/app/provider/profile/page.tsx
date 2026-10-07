"use client";

import { useState } from "react";

export default function ProviderProfilePage() {
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/providers/profile/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legalName, country }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Draft saved. Submitting does not publish — SOPHIMA review required." : data.error);
  }

  return (
    <>
      <p className="eyebrow">Institution Apply</p>
      <h1>Institution profile</h1>
      <p className="lead">Draft changes do not overwrite the last approved published policy.</p>
      <form className="panel" onSubmit={saveDraft}>
        <label className="field">
          <span>Legal name</span>
          <input value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Country of incorporation</span>
          <input value={country} onChange={(e) => setCountry(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary">Save draft</button>
      </form>
      {message && <div className="notice">{message}</div>}
    </>
  );
}
