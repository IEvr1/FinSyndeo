"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ApplicantPrivacyPage() {
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<Array<{ id: string; requestType: string; status: string }>>([]);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "" });

  useEffect(() => {
    fetch("/api/applicants/data-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => undefined);
  }, []);

  async function submitRequest(type: string) {
    const res = await fetch("/api/applicants/data-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Request submitted. SOPHIMA will respond within applicable deadlines." : data.error);
    if (res.ok) {
      const list = await fetch("/api/applicants/data-requests").then((r) => r.json());
      setRequests(list.requests ?? []);
    }
  }

  async function changePassword() {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwordForm.current, password: passwordForm.next }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Password updated." : data.error);
  }

  async function signOutAll() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <>
      <p className="eyebrow">Sign-in &amp; data</p>
      <h1>Sign-in &amp; data settings</h1>
      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <h2>Your sign-in</h2>
        <p className="text-sm text-[var(--muted)]">Registered name and verified sign-in email are shown in your account profile.</p>
        <label className="field">
          <span>Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={passwordForm.next}
            onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
          />
        </label>
        <div className="flex flex-wrap gap-3 mt-2">
          <button type="button" className="btn" onClick={changePassword}>Change password</button>
          <button type="button" className="btn" onClick={signOutAll}>Sign out of all sessions</button>
          <button type="button" className="btn" onClick={() => submitRequest("close_sign_in")}>
            Close my sign-in
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Your information</h2>
        <p className="text-sm text-[var(--muted)]">
          Assessment contact email may differ from your sign-in email. Edit assessments under{" "}
          <Link href="/applicant/assessments">My assessments</Link>.
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <button type="button" className="btn" onClick={() => submitRequest("download_my_information")}>
            Download my information
          </button>
          <button type="button" className="btn" onClick={() => submitRequest("correct_personal_data")}>
            Request a correction
          </button>
          <button type="button" className="btn" onClick={() => submitRequest("delete_personal_data")}>
            Request deletion of my personal data
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Closing access or requesting deletion</h2>
        <p>
          <Link href="/legal/privacy">Privacy Notice</Link> and retention policy.
        </p>
        <p className="text-sm text-[var(--muted)] mt-3">
          Closing your sign-in and deleting personal data are separate actions. Some information may need to be
          retained under the applicable retention policy. We will explain any information retained and why.
        </p>
        {requests.length > 0 && (
          <ul className="mt-4">
            {requests.map((r) => (
              <li key={r.id}>{r.requestType} — {r.status}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
