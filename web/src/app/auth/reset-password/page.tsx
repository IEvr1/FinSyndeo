"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { validatePassword } from "@/lib/password-policy";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing a token. Request a new link from the sign-in page.");
      return;
    }
    const pw = validatePassword(password);
    if (!pw.ok) {
      setError(pw.message);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to reset password.");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12 w-full">
      <h1>Choose a new password</h1>
      {done ? (
        <div className="panel">
          <div className="notice">Your password has been updated.</div>
          <p className="text-sm">
            <Link href="/auth/sign-in">Sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="panel">
          {error && <div className="notice notice-error">{error}</div>}
          {!token && (
            <div className="notice notice-error">
              Missing reset token. Open the link from your email, or{" "}
              <Link href="/auth/forgot-password">request a new link</Link>.
            </div>
          )}
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            showHint
          />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !token}>
            Update password
          </button>
        </form>
      )}
      <p className="text-sm text-[var(--muted)] mt-4">
        <Link href="/auth/sign-in">Back to sign in</Link>
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="px-6 py-5 bg-white border-b border-[var(--line)]">
        <Link href="/">
          <Image src="/assets/FinSyndeo-logo.png" alt="FinSyndeo" width={180} height={48} />
        </Link>
      </header>
      <Suspense fallback={<p className="p-6">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
