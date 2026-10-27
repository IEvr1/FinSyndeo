"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { validatePassword } from "@/lib/password-policy";

export default function ApplicantPrivacyPage() {
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<Array<{ id: string; requestType: string; status: string }>>([]);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "" });
  const [profile, setProfile] = useState<{ email?: string; name?: string | null }>({});

  useEffect(() => {
    fetch("/api/applicants/data-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => undefined);
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setProfile({ email: d.user.email, name: d.user.name });
      })
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
    const pw = validatePassword(passwordForm.next);
    if (!pw.ok) {
      setMessage(pw.message);
      return;
    }
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

  function closeSignIn() {
    if (
      !confirm(
        "Close your sign-in? This disables access, revokes sessions and stops future match alerts. Active assessments and introduction requests are not deleted by this action alone. Re-authentication may be required."
      )
    ) {
      return;
    }
    void submitRequest("close_sign_in");
  }

  return (
    <>
      <p className="eyebrow">Sign-in &amp; data</p>
      <h1>Sign-in &amp; data settings</h1>
      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <h2>Your sign-in</h2>
        <dl className="summary">
          <div className="contents">
            <dt>Registered name</dt>
            <dd>{profile.name || "Not set"}</dd>
          </div>
          <div className="contents">
            <dt>Verified sign-in email</dt>
            <dd>{profile.email || "—"}</dd>
          </div>
        </dl>
        <p className="text-sm text-[var(--muted)] mt-2">
          Assessment contact email may differ from this sign-in email.
        </p>
        <PasswordField
          label="Current password"
          value={passwordForm.current}
          onChange={(v) => setPasswordForm((p) => ({ ...p, current: v }))}
          autoComplete="current-password"
          required={false}
        />
        <PasswordField
          label="New password"
          value={passwordForm.next}
          onChange={(v) => setPasswordForm((p) => ({ ...p, next: v }))}
          autoComplete="new-password"
          required={false}
          showHint
        />
        <div className="flex flex-wrap gap-3 mt-2">
          <button type="button" className="btn" onClick={changePassword}>
            Change password
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              setMessage(
                "To change your sign-in email, contact introductions@sophima.ai. The new address must be verified before confidential messages are sent there."
              )
            }
          >
            Change sign-in email
          </button>
          <button type="button" className="btn" onClick={signOutAll}>
            Sign out of all sessions
          </button>
          <button type="button" className="btn" onClick={closeSignIn}>
            Close my sign-in
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Your information</h2>
        <p className="text-sm text-[var(--muted)]">
          Edit assessments under <Link href="/applicant/assessments">My assessments</Link>. Download excludes other
          users&apos; information, confidential provider documents, SOPHIMA internal notes and commission records.
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
        <p className="mt-4">
          <Link href="/legal/privacy">Privacy Notice</Link>
          {" · "}
          <Link href="/legal/retention">Retention policy</Link>
        </p>
      </section>

      <section className="panel">
        <h2>Closing access or requesting deletion</h2>
        <p className="text-sm text-[var(--muted)] mt-3">
          Closing your sign-in and deleting personal data are separate actions. Some information may need to be
          retained under the applicable retention policy. We will explain any information retained and why. We do not
          promise deletion of information already disclosed to an institution or held independently by it.
        </p>
        {requests.length > 0 && (
          <ul className="mt-4">
            {requests.map((r) => (
              <li key={r.id}>
                {r.requestType} — {r.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
