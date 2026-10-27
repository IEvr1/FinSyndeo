"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthChrome } from "@/components/AuthChrome";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to start password reset.");
        return;
      }
      setMessage(data.message ?? "Check your email for reset instructions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthChrome>
      <h1>Reset password</h1>
      <p className="lead">Enter your account email. We will send reset instructions if the account exists.</p>
      <form onSubmit={handleSubmit} className="panel">
        {error && <div className="notice notice-error">{error}</div>}
        {message && <div className="notice">{message}</div>}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          Send reset link
        </button>
      </form>
      <p className="text-sm text-[var(--muted)] mt-4">
        <Link href="/auth/sign-in">Back to sign in</Link>
      </p>
    </AuthChrome>
  );
}
