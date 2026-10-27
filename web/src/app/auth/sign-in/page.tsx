"use client";

import { useState } from "react";
import Link from "next/link";
import { PasswordField } from "@/components/PasswordField";
import { AuthChrome } from "@/components/AuthChrome";

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
    <AuthChrome
      nav={
        <nav className="public-header-nav">
          <Link href="/auth/sign-in">Sign in</Link>
          <Link href="/auth/sign-up" className="btn">
            Register
          </Link>
        </nav>
      }
    >
      <p className="eyebrow">Welcome back</p>
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
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Enter your password"
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
    </AuthChrome>
  );
}
