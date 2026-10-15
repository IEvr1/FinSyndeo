"use client";

import { useEffect, useState } from "react";

const PERIODS = ["Monthly", "Quarterly"];

export default function ProviderPreferencesPage() {
  const [periods, setPeriods] = useState<string[]>(["Monthly"]);
  const [scheduled, setScheduled] = useState(true);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [reportingEnabled, setReportingEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/providers/reporting-preferences")
      .then((r) => r.json())
      .then((d) => {
        setReportingEnabled(d.reportingEnabled !== false);
        setPeriods(d.periods ?? ["Monthly"]);
        setScheduled(d.scheduled !== false);
        setEmail(d.email ?? "");
      })
      .catch(() => undefined);
  }, []);

  if (!reportingEnabled) {
    return (
      <>
        <p className="eyebrow">Reporting preferences</p>
        <h1>Your reporting preferences</h1>
        <section className="panel notice">Scheduled reporting is not currently available.</section>
      </>
    );
  }

  async function save() {
    const res = await fetch("/api/providers/reporting-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periods, scheduled, email }),
    });
    setSaved(res.ok);
  }

  return (
    <>
      <p className="eyebrow">Reporting preferences</p>
      <h1>Your reporting preferences</h1>
      <p className="lead">Choose when to receive a summary of cases introduced to your institution.</p>
      <section className="panel">
        <fieldset>
          <legend>Reporting periods</legend>
          <div className="checks">
            {PERIODS.map((p) => (
              <label key={p}>
                <input
                  type="checkbox"
                  checked={periods.includes(p)}
                  onChange={(e) => {
                    setPeriods(e.target.checked ? [...new Set([...periods, p])] : periods.filter((x) => x !== p));
                  }}
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="checkline">
          <input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} />
          <span>Receive scheduled reports</span>
        </label>
        <button type="button" className="btn mt-4">Request a report now</button>
        <label className="field">
          <span>Report recipient email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary mt-4" onClick={save}>
          Save preferences
        </button>
        {saved && <p className="notice mt-4">Preferences saved.</p>}
      </section>
    </>
  );
}
