"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { AuthChrome } from "@/components/AuthChrome";
import { validatePassword } from "@/lib/password-policy";

export default function SignUpForm() {
  const params = useSearchParams();
  const roleParam = params.get("role");
  const role: "applicant" | "provider" | null =
    roleParam === "provider" ? "provider" : roleParam === "applicant" ? "applicant" : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const headerNav = (
    <nav className="public-header-nav">
      <Link href="/auth/sign-in">Sign in</Link>
      <Link href="/auth/sign-up" className="btn">
        Register
      </Link>
    </nav>
  );

  if (!role) {
    return (
      <AuthChrome nav={headerNav}>
        <p className="eyebrow">Register</p>
        <h1>Create an account</h1>
        <p className="lead">Choose how you will use SOPHIMA AI. Introducer and Admin access is invitation-only.</p>
        <div className="tiles" style={{ gridTemplateColumns: "1fr" }}>
          <section className="tile">
            <h2>Looking for a financial provider?</h2>
            <p>Complete your profile and explore institutions that may meet your requirements.</p>
            <Link href="/auth/sign-up?role=applicant" className="btn btn-primary mt-3">
              Register as Applicant
            </Link>
          </section>
          <section className="tile">
            <h2>Represent a financial institution?</h2>
            <p>Manage your institution profile, services and eligibility criteria.</p>
            <Link href="/auth/sign-up?role=provider" className="btn btn-primary mt-3">
              Register as Provider
            </Link>
          </section>
        </div>
        <p className="text-sm text-[var(--muted)] mt-4">
          Already registered? <Link href="/auth/sign-in">Sign in</Link>
        </p>
      </AuthChrome>
    );
  }

  const heading = role === "provider" ? "Register as a Provider" : "Register as an Applicant";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const pw = validatePassword(password);
    if (!pw.ok) {
      setError(pw.message);
      return;
    }
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      return;
    }
    window.location.href = data.redirect ?? "/";
  }

  return (
    <AuthChrome nav={headerNav}>
      <h1>{heading}</h1>
      <p className="text-sm text-[var(--muted)] mb-4">
        <Link href="/auth/sign-up">Change registration type</Link>
      </p>
      <form onSubmit={handleSubmit} className="panel">
        {error && <div className="notice notice-error">{error}</div>}
        <label className="field">
          <span>Name</span>
          <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
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
          autoComplete="new-password"
          showHint
        />
        <button type="submit" className="btn btn-primary w-full">
          Register
        </button>
      </form>
      <p className="text-sm text-[var(--muted)] mt-4">
        Already registered? <Link href="/auth/sign-in">Sign in</Link>
      </p>
    </AuthChrome>
  );
}
