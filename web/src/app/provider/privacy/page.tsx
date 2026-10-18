"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { validatePassword } from "@/lib/password-policy";

export default function ProviderPrivacyPage() {
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<Array<{ id: string; requestType: string; status: string }>>([]);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "" });

  useEffect(() => {
    fetch("/api/providers/data-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => undefined);
  }, []);

  async function submitRequest(type: string) {
    const res = await fetch("/api/providers/data-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Request submitted. SOPHIMA will respond within applicable deadlines." : data.error);
    if (res.ok) {
      const list = await fetch("/api/providers/data-requests").then((r) => r.json());
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

  return (
    <>
      <p className="eyebrow">Sign-in &amp; data</p>
      <h1>Sign-in & data settings</h1>
      {message && <div className="notice">{message}</div>}
      <section className="panel">
        <h2>Your sign-in</h2>
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
        <button type="button" className="btn" onClick={changePassword}>Change password</button>
        <button type="button" className="btn ml-3" onClick={signOutAll}>Sign out of all sessions</button>
      </section>
      <section className="panel">
        <h2>Institution profile</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/provider/profile" className="btn">Edit institution profile</Link>
          <Link href="/provider/profile" className="btn">Download my responses</Link>
          <button type="button" className="btn" onClick={() => submitRequest("removal_from_listings")}>
            Request removal from provider listings
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>Privacy &amp; personal data</h2>
        <p>
          <Link href="/provider/privacy">Privacy Notice</Link> and retention policy.
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <button type="button" className="btn" onClick={() => submitRequest("export_personal_data")}>
            Request a copy of my personal data
          </button>
          <button type="button" className="btn" onClick={() => submitRequest("correct_personal_data")}>
            Request correction or deletion of my personal data
          </button>
          <button type="button" className="btn" onClick={() => submitRequest("close_sign_in")}>
            Close my sign-in
          </button>
        </div>
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
