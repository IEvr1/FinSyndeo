"use client";

import { useState } from "react";

export function AdminReceiptForm() {
  const [providerId, setProviderId] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [verifiedCashMinor, setVerifiedCashMinor] = useState(0);
  const [valueDate, setValueDate] = useState("");
  const [relationshipId, setRelationshipId] = useState("");
  const [statementLineId, setStatementLineId] = useState("");
  const [grossMinor, setGrossMinor] = useState(0);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/provider-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        header: {
          providerId,
          bankReference,
          currency,
          valueDate,
          verifiedCashMinor,
        },
        lines: [
          {
            statementLineId,
            relationshipId,
            grossMinor,
            vatMinor: 0,
            withholdingMinor: 0,
            chargesMinor: 0,
            taxMode: "reverse_charge",
            actualCashMinor: verifiedCashMinor,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Posting failed.");
      return;
    }
    setMessage(`Posted receipt ${data.receiptId} (${data.postedEntryIds?.length ?? 0} entries).`);
  }

  return (
    <form onSubmit={submit} className="panel mb-6">
      <h2>Post provider receipt</h2>
      <p className="text-sm text-[var(--muted)]">Single-line batch for authorised posting. Relationship must be activated or financing disbursed.</p>
      <label className="field">
        <span>Provider ID</span>
        <input value={providerId} onChange={(e) => setProviderId(e.target.value)} required />
      </label>
      <label className="field">
        <span>Bank reference</span>
        <input value={bankReference} onChange={(e) => setBankReference(e.target.value)} required />
      </label>
      <label className="field">
        <span>Relationship ID</span>
        <input value={relationshipId} onChange={(e) => setRelationshipId(e.target.value)} required />
      </label>
      <label className="field">
        <span>Statement line ID</span>
        <input value={statementLineId} onChange={(e) => setStatementLineId(e.target.value)} required />
      </label>
      <label className="field">
        <span>Gross (minor)</span>
        <input type="number" value={grossMinor} onChange={(e) => setGrossMinor(Number(e.target.value))} />
      </label>
      <label className="field">
        <span>Verified cash total (minor)</span>
        <input
          type="number"
          value={verifiedCashMinor}
          onChange={(e) => setVerifiedCashMinor(Number(e.target.value))}
          required
        />
      </label>
      <label className="field">
        <span>Value date</span>
        <input type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} required />
      </label>
      <label className="field">
        <span>Currency</span>
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
      </label>
      <button type="submit" className="btn btn-primary">
        Post receipt
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </form>
  );
}
