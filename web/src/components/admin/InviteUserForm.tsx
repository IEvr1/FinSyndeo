"use client";

import { useState } from "react";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"introducer" | "admin">("introducer");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Invitation failed.");
        return;
      }
      setMessage(`Invitation recorded for ${email} (${role}).`);
      setEmail("");
      setName("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="text-lg mt-0 mb-3">Invite user</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        Introducer and admin access remains invitation-only. Production admin invites require MFA on your account.
      </p>
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}
      <form onSubmit={submit} className="grid gap-0" style={{ maxWidth: 480 }}>
        <label className="field">
          <span>Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as "introducer" | "admin")}>
            <option value="introducer">Introducer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Sending…" : "Send invitation"}
        </button>
      </form>
    </section>
  );
}
