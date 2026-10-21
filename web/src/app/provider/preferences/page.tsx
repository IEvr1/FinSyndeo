"use client";

import { useEffect, useState } from "react";

const PERIODS = ["Monthly", "Quarterly"];

export default function ProviderPreferencesPage() {
  const [periods, setPeriods] = useState<string[]>(["Monthly"]);
  const [scheduled, setScheduled] = useState(true);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [reportingEnabled, setReportingEnabled] = useState(true);
  const [nextDelivery, setNextDelivery] = useState<string | null>(null);
  const [showAdHoc, setShowAdHoc] = useState(false);
  const [adHocFrom, setAdHocFrom] = useState("");
  const [adHocTo, setAdHocTo] = useState("");
  const [adHocMessage, setAdHocMessage] = useState("");

  useEffect(() => {
    fetch("/api/providers/reporting-preferences")
      .then((r) => r.json())
      .then((d) => {
        setReportingEnabled(d.reportingEnabled !== false);
        setPeriods(d.periods ?? ["Monthly"]);
        setScheduled(d.scheduled !== false);
        setEmail(d.email ?? "");
        setNextDelivery(d.nextDelivery ?? null);
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
    const data = await res.json().catch(() => ({}));
    setSaved(res.ok);
    if (res.ok) setNextDelivery(data.nextDelivery ?? nextScheduledHint(periods));
  }

  function nextScheduledHint(selected: string[]) {
    if (!selected.length || !scheduled) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + (selected.includes("Monthly") ? 1 : 3));
    return d.toISOString().slice(0, 10);
  }

  async function requestAdHoc() {
    if (!adHocFrom || !adHocTo) {
      setAdHocMessage("Select a from and to date.");
      return;
    }
    if (adHocFrom > adHocTo) {
      setAdHocMessage("The from date must be on or before the to date.");
      return;
    }
    const res = await fetch("/api/providers/reporting-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: adHocFrom, to: adHocTo }),
    });
    setAdHocMessage(
      res.ok
        ? "Ad hoc report requested. SOPHIMA will prepare it for the authorised cases in that range."
        : "Unable to request report."
    );
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
        <button type="button" className="btn mt-4" onClick={() => setShowAdHoc((v) => !v)}>
          Request a report now
        </button>
        {showAdHoc && (
          <div className="grid mt-4">
            <label className="field">
              <span>From</span>
              <input type="date" value={adHocFrom} onChange={(e) => setAdHocFrom(e.target.value)} />
            </label>
            <label className="field">
              <span>To</span>
              <input type="date" value={adHocTo} onChange={(e) => setAdHocTo(e.target.value)} />
            </label>
            <button type="button" className="btn" onClick={requestAdHoc}>
              Submit ad hoc request
            </button>
            {adHocMessage && <p className="notice">{adHocMessage}</p>}
          </div>
        )}
        <label className="field">
          <span>Report recipient email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <small>Changes must be verified before delivery.</small>
        </label>
        <button type="button" className="btn btn-primary mt-4" onClick={save}>
          Save preferences
        </button>
        {saved && <p className="notice mt-4">Preferences saved.</p>}
        {nextDelivery && scheduled && (
          <p className="hint mt-3">Next scheduled delivery: {nextDelivery}</p>
        )}
      </section>
    </>
  );
}
