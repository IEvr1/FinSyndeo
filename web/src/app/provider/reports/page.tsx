"use client";

import { useEffect, useState } from "react";

type CaseRow = {
  reference: string;
  applicantName: string | null;
  service: string;
  introductionDate: string;
  status: string;
  canViewProfile: boolean;
};

type ReportRow = {
  id: string;
  period: string;
  generatedAt: string;
  format: string;
};

export default function ProviderReportsPage() {
  const [tab, setTab] = useState<"cases" | "reports">("cases");
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    fetch(`/api/providers/cases?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setCases(d.cases ?? []);
        setReports(d.reports ?? []);
      })
      .catch(() => undefined);
  }, [q, status]);

  const hasCases = cases.length > 0;

  return (
    <>
      <p className="eyebrow">Referred cases &amp; reports</p>
      <h1>Your referred cases &amp; reports</h1>
      <p className="lead">View cases introduced to your institution and download available reports.</p>
      <p className="hint">Only information authorised for your institution is available here.</p>
      <div className="grid" style={{ maxWidth: 720, marginBottom: 16 }}>
        <label className="field">
          <span>Search</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reference, name or service" />
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="requested">Requested</option>
            <option value="released">Released</option>
          </select>
        </label>
      </div>
      <div className="tabs" role="tablist">
        <button
          type="button"
          className="tab-btn"
          role="tab"
          aria-selected={tab === "cases"}
          onClick={() => setTab("cases")}
        >
          Referred cases
        </button>
        <button
          type="button"
          className="tab-btn"
          role="tab"
          aria-selected={tab === "reports"}
          onClick={() => setTab("reports")}
        >
          Reports
        </button>
      </div>
      {!hasCases && tab === "cases" ? (
        <section className="panel notice">No cases have been introduced to your institution yet.</section>
      ) : tab === "cases" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Applicant</th>
                <th>Service</th>
                <th>Introduced</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.reference}>
                  <td>{c.reference}</td>
                  <td>{c.applicantName ?? "—"}</td>
                  <td>{c.service}</td>
                  <td>{new Date(c.introductionDate).toLocaleDateString()}</td>
                  <td>{c.status}</td>
                  <td>
                    {c.canViewProfile ? (
                      <button type="button" className="btn mini">View client profile</button>
                    ) : (
                      "Pending sharing"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : reports.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Generated</th>
                <th>Format</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.period}</td>
                  <td>{new Date(r.generatedAt).toLocaleDateString()}</td>
                  <td>{r.format}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="panel notice">No reports are available yet.</section>
      )}
    </>
  );
}
