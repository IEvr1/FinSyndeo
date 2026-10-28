"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  currency: string;
  totalMinor: number;
  status: string;
  createdAt: string;
};

export function PaymentsContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetch("/api/introducers/me/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices ?? []));
  }, []);

  return (
    <section className="panel">
      {invoices.length === 0 ? (
        <p>No invoices submitted yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Total</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>
                    {(inv.totalMinor / 100).toFixed(2)} {inv.currency}
                  </td>
                  <td>{inv.status}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
