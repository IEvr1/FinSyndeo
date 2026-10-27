"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatAssessmentRoute } from "@/lib/questionnaire/private-banking-config";

type App = { id: string; route: string; status: string; updatedAt: string };

export function AlertsContent() {
  const searchParams = useSearchParams();
  const urlAppId = searchParams.get("applicationId") ?? "";
  const [apps, setApps] = useState<App[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState("80");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    setLoadingApps(true);
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.applications ?? []) as App[];
        setApps(list);
        if (urlAppId && list.some((a) => a.id === urlAppId)) {
          setApplicationId(urlAppId);
        } else if (list[0]) {
          setApplicationId(list[0].id);
        }
      })
      .finally(() => setLoadingApps(false));
  }, [urlAppId]);

  useEffect(() => {
    if (!applicationId) return;
    setSaved(false);
    fetch(`/api/applicants/match-preferences?applicationId=${encodeURIComponent(applicationId)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) return;
        setEnabled(d.enabled === true);
        setThreshold(String(d.threshold ?? 80));
        setEmail(d.email ?? "");
      })
      .catch(() => undefined);
  }, [applicationId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId) return;
    setLoading(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/applicants/match-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId,
        enabled,
        threshold: Number(threshold),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save preferences.");
      return;
    }
    setEmail(data.email ?? email);
    setSaved(true);
  }

  const selected = apps.find((a) => a.id === applicationId);
  const resultsHref = applicationId
    ? `/applicant/results?id=${encodeURIComponent(applicationId)}`
    : "/applicant/results";

  return (
    <>
      <p className="eyebrow">Match notifications</p>
      <h1>Match notifications</h1>
      <p className="lead">Receive an email when a new provider matches your saved requirements.</p>
      {loadingApps && <p className="text-sm text-[var(--muted)]">Loading assessments…</p>}
      <form className="panel" onSubmit={save}>
        {!loadingApps && apps.length === 0 && (
          <p className="empty">
            Save an assessment first, then choose notification preferences for it.{" "}
            <Link href="/applicant/assessments">Choose an assessment</Link>
          </p>
        )}
        {apps.length > 0 && (
          <label className="field">
            <span>Assessment</span>
            <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {formatAssessmentRoute(a.route)} · {new Date(a.updatedAt).toLocaleDateString()} ·{" "}
                  {a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
        )}
        {selected && (
          <p className="text-sm text-[var(--muted)]">
            {formatAssessmentRoute(selected.route)} · Last updated{" "}
            {new Date(selected.updatedAt).toLocaleDateString()}
          </p>
        )}
        <label className="checkline flex gap-2 items-start mt-4">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
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
        <div className="flex flex-wrap gap-3 mt-4">
          <button type="submit" className="btn btn-primary" disabled={!applicationId || loading}>
            Save preferences
          </button>
          {applicationId && (
            <Link href={resultsHref} className="btn">
              Back to this assessment&apos;s results
            </Link>
          )}
          {!applicationId && !loadingApps && (
            <Link href="/applicant/assessments" className="btn">
              Choose an assessment
            </Link>
          )}
        </div>
        {error && <p className="notice notice-error mt-3">{error}</p>}
        {saved && (
          <p className="notice mt-3">
            Preferences saved
            {email ? `. Notifications will be sent to ${email}.` : "."} Disabling alerts does not delete this
            assessment.
          </p>
        )}
      </form>
    </>
  );
}
