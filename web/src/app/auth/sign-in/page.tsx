"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PasswordField } from "@/components/PasswordField";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Sign in failed.");
      return;
    }
    window.location.href = data.redirect ?? "/";
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="px-6 py-5 bg-white border-b border-[var(--line)]">
        <Link href="/">
          <Image src="/assets/FinSyndeo-logo.png" alt="FinSyndeo" width={180} height={48} />
        </Link>
      </header>
      <main className="max-w-md mx-auto px-6 py-12 w-full">
        <h1>Sign in</h1>
        <p className="lead">Applicant and provider accounts. Introducer and Admin access is invitation-only.</p>
        <form onSubmit={handleSubmit} className="panel">
          {error && <div className="notice notice-error">{error}</div>}
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
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>
        <p className="text-sm text-[var(--muted)] mt-4">
          <Link href="/auth/forgot-password">Forgot password?</Link>
          {" · "}
          No account? <Link href="/auth/sign-up">Register</Link>
        </p>
      </main>
    </div>
  );
}
