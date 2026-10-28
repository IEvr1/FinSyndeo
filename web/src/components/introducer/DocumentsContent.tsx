"use client";

import { useEffect, useState } from "react";

type Agreement = {
  id: string;
  agreementType: string;
  version: string;
  status: string;
  hasUnresolvedPlaceholders: boolean;
};

export function DocumentsContent() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/introducers/me/agreements")
      .then((r) => r.json())
      .then((d) => setAgreements(d.agreements ?? []))
      .catch(() => setAgreements([]));
  }, []);

  async function accept(id: string) {
    setMessage("");
    const res = await fetch(`/api/agreements/${id}/acceptance`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Acceptance failed.");
      return;
    }
    setMessage("Agreement accepted.");
    const list = await fetch("/api/introducers/me/agreements").then((r) => r.json());
    setAgreements(list.agreements ?? []);
  }

  return (
    <>
      <p className="lead">Review and accept your introducer agreements. Drafts are not for execution.</p>
      {message && <div className="notice">{message}</div>}
      <section className="panel">
        {agreements.length === 0 ? (
          <p>No documents available. SOPHIMA will publish your agreement package.</p>
        ) : (
          <ul className="space-y-3">
            {agreements.map((a) => (
              <li key={a.id} className="border-b pb-2">
                <strong>{a.agreementType}</strong> · v{a.version} · {a.status}
                {a.hasUnresolvedPlaceholders && (
                  <span className="text-sm text-amber-700"> · NOT FOR EXECUTION</span>
                )}
                {a.status === "awaiting_acceptance" && (
                  <button type="button" className="btn btn-primary ml-2 text-sm" onClick={() => accept(a.id)}>
                    Accept
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
