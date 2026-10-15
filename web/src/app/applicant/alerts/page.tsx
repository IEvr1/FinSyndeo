"use client";

import { useEffect, useState } from "react";

type App = { id: string; route: string; status: string; updatedAt: string };

export default function AlertsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState("80");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.applications ?? []) as App[];
        setApps(list);
        if (list[0]) setApplicationId(list[0].id);
      });
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  const selected = apps.find((a) => a.id === applicationId);

  return (
    <>
      <p className="eyebrow">Match notifications</p>
      <h1>Match notifications</h1>
      <p className="lead">Receive an email when a new provider matches your saved requirements.</p>
      <form className="panel" onSubmit={save}>
        {apps.length > 1 && (
          <label className="field">
            <span>Assessment</span>
            <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.route} · {new Date(a.updatedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
        )}
        {selected && (
          <p className="text-sm text-[var(--muted)]">
            {selected.route} · Last updated {new Date(selected.updatedAt).toLocaleDateString()}
          </p>
        )}
        <label className="checkline flex gap-2 items-start mt-4">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span>Email me when a new provider matches this assessment.</span>
        </label>
        {enabled && (
          <label className="field">
            <span>Minimum match score</span>
            <select value={threshold} onChange={(e) => setThreshold(e.target.value)}>
              <option value="70">70%</option>
              <option value="80">80%</option>
              <option value="90">90%</option>
              <option value="100">100%</option>
            </select>
          </label>
        )}
        <p className="text-sm text-[var(--muted)]">
          All essential requirements must be met. The score reflects your preferences, not the likelihood of account
          approval.
        </p>
        <button type="submit" className="btn btn-primary">Save preferences</button>
        {saved && <p className="notice mt-3">Preferences saved. Notifications will be sent to your verified sign-in email.</p>}
      </form>
    </>
  );
}
