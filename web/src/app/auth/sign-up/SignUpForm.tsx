"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { validatePassword } from "@/lib/password-policy";

export default function SignUpForm() {
  const params = useSearchParams();
  const router = useRouter();
  const roleParam = params.get("role");
  const role: "applicant" | "provider" | null =
    roleParam === "provider" ? "provider" : roleParam === "applicant" ? "applicant" : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!role) router.replace("/");
  }, [role, router]);

  if (!role) {
    return null;
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
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="px-6 py-5 bg-white border-b border-[var(--line)]">
        <Link href="/">
          <Image src="/assets/FinSyndeo-logo.png" alt="FinSyndeo" width={180} height={48} />
        </Link>
      </header>
      <main className="max-w-md mx-auto px-6 py-12 w-full">
        <h1>{heading}</h1>
        <p className="text-sm text-[var(--muted)] mb-4">
          <Link href="/">Change registration type</Link>
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
      </main>
    </div>
  );
}
