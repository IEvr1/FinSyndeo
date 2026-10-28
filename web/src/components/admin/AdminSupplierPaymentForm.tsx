"use client";

import { useState } from "react";

export function AdminSupplierPaymentForm() {
  const [invoiceId, setInvoiceId] = useState("");
  const [amountMinor, setAmountMinor] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [valueDate, setValueDate] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/supplier-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, amountMinor, currency, valueDate, bankReference }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed.");
      return;
    }
    setMessage("Payment recorded.");
  }

  return (
    <form onSubmit={submit} className="panel mb-4">
      <h2>Record supplier payment</h2>
      <label className="field">
        <span>Invoice ID</span>
        <input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} required />
      </label>
      <label className="field">
        <span>Amount (minor)</span>
        <input type="number" value={amountMinor} onChange={(e) => setAmountMinor(Number(e.target.value))} />
      </label>
      <label className="field">
        <span>Bank reference</span>
        <input value={bankReference} onChange={(e) => setBankReference(e.target.value)} required />
      </label>
      <label className="field">
        <span>Value date</span>
        <input type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} required />
      </label>
      <button type="submit" className="btn btn-primary">
        Record payment
      </button>
      {message && <p className="text-sm mt-2">{message}</p>}
    </form>
  );
}
