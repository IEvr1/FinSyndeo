"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  shareMinor: number;
  currency: string;
  ratePercent: number;
  postedAt: string;
  clientName: string | null;
  providerName: string | null;
  invoiced: boolean;
};

export function LedgerContent() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    fetch("/api/introducers/me/commissions")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []));
  }, []);

  function exportCsv() {
    const header = "id,client,provider,shareMinor,currency,ratePercent,postedAt,invoiced\n";
    const rows = entries
      .map(
        (e) =>
          `${e.id},${JSON.stringify(e.clientName ?? "")},${JSON.stringify(e.providerName ?? "")},${e.shareMinor},${e.currency},${e.ratePercent},${e.postedAt},${e.invoiced}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commission-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="button-row mb-4">
        <button type="button" className="btn" onClick={exportCsv} disabled={entries.length === 0}>
          Export CSV
        </button>
      </div>
      <section className="panel">
        {entries.length === 0 ? (
          <p>No posted commission entries.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Posted</th>
                  <th>Client</th>
                  <th>Provider</th>
                  <th>Share</th>
                  <th>Rate</th>
                  <th>Invoiced</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.postedAt).toLocaleDateString()}</td>
                    <td>{e.clientName ?? "—"}</td>
                    <td>{e.providerName ?? "—"}</td>
                    <td>
                      {(e.shareMinor / 100).toFixed(2)} {e.currency}
                    </td>
                    <td>{e.ratePercent}%</td>
                    <td>{e.invoiced ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
