"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; shareMinor: number; currency: string; clientName: string | null; invoiced: boolean };

export function InvoiceUploadContent() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [taxMinor, setTaxMinor] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/introducers/me/commissions")
      .then((r) => r.json())
      .then((d) => setEntries((d.entries ?? []).filter((e: Entry) => !e.invoiced)));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const ids = [...selected];
    if (!invoiceNumber || ids.length === 0) {
      setMessage("Select entries and enter an invoice number.");
      return;
    }
    const currency = entries.find((x) => ids.includes(x.id))?.currency ?? "EUR";
    const res = await fetch("/api/introducers/me/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber,
        currency,
        commissionEntryIds: ids,
        taxMinor,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Submission failed.");
      return;
    }
    setMessage("Invoice submitted.");
    setSelected(new Set());
    setInvoiceNumber("");
  }

  return (
    <>
      {message && <div className="notice">{message}</div>}
      <form onSubmit={submit} className="panel">
        <h2>Allocate commission entries</h2>
        <label className="field">
          <span>Invoice number</span>
          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
        </label>
        <label className="field">
          <span>Supplier tax (minor units)</span>
          <input
            type="number"
            value={taxMinor}
            onChange={(e) => setTaxMinor(Number(e.target.value))}
            min={0}
          />
        </label>
        <ul>
          {entries.map((e) => (
            <li key={e.id}>
              <label>
                <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />{" "}
                {e.clientName ?? e.id.slice(0, 8)} — {(e.shareMinor / 100).toFixed(2)} {e.currency}
              </label>
            </li>
          ))}
        </ul>
        <button type="submit" className="btn btn-primary">
          Submit invoice
        </button>
      </form>
    </>
  );
}
