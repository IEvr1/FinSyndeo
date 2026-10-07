"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROUTES = [
  { value: "bank", label: "Business bank account" },
  { value: "merchant", label: "Merchant account" },
  { value: "both", label: "Bank & merchant accounts" },
  { value: "financing", label: "Financing" },
  { value: "individual", label: "Private banking" },
  { value: "institution", label: "Correspondent / payment accounts" },
];

export function QuestionnaireWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [route, setRoute] = useState("bank");
  const [companyName, setCompanyName] = useState("");
  const [incorporation, setIncorporation] = useState("");
  const [registration, setRegistration] = useState("");
  const [activity, setActivity] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const typedData = {
      schemaVersion: "1",
      route,
      applicant: {
        kind: route === "individual" ? "individual" : route === "institution" ? "financial_institution" : "entity",
        name: route === "individual" ? companyName : companyName,
        jurisdiction: incorporation,
        registration: route === "individual" ? null : registration,
      },
      business: route === "individual" ? null : { activity, industry: "Consulting & professional services" },
      requirements: {},
      screeningSubjects: [
        {
          id: "applicant",
          kind: route === "individual" ? "individual" : "entity",
          name: companyName,
          roles: ["applicant"],
          country: incorporation,
        },
      ],
      context: { contact: { name: companyName, email: contactEmail } },
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route, typedData }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }

    const confirmRes = await fetch(`/api/applications/${data.application.id}/revisions`, {
      method: "POST",
    });
    if (!confirmRes.ok) {
      router.push("/applicant/assessments");
      return;
    }
    router.push(`/applicant/results?id=${data.application.id}`);
  }

  return (
    <div>
      {error && <div className="notice notice-error">{error}</div>}
      {step === 0 && (
        <section className="panel">
          <p className="eyebrow">Step 1</p>
          <h2>Service and consent</h2>
          <label className="field">
            <span>What do you need?</span>
            <select value={route} onChange={(e) => setRoute(e.target.value)}>
              {ROUTES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="checkline flex gap-2 items-start">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I agree to the processing of my information under the Privacy Notice.</span>
          </label>
          <button className="btn btn-primary" disabled={!consent} onClick={() => setStep(1)}>
            Continue
          </button>
        </section>
      )}
      {step === 1 && (
        <section className="panel">
          <p className="eyebrow">Step 2</p>
          <h2>{route === "individual" ? "Personal details" : "Company details"}</h2>
          <label className="field">
            <span>{route === "individual" ? "Full name" : "Registered entity name"}</span>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </label>
          <label className="field">
            <span>{route === "individual" ? "Country of residence" : "Country / jurisdiction of incorporation"}</span>
            <input value={incorporation} onChange={(e) => setIncorporation(e.target.value)} required />
          </label>
          {route !== "individual" && (
            <label className="field">
              <span>Registration number</span>
              <input value={registration} onChange={(e) => setRegistration(e.target.value)} required />
            </label>
          )}
          <div className="flex gap-3">
            <button className="btn" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="panel">
          <p className="eyebrow">Step 3 · Summary</p>
          <h2>Your assessment summary</h2>
          <dl>
            <dt>Service</dt>
            <dd>{ROUTES.find((r) => r.value === route)?.label}</dd>
            <dt>Name</dt>
            <dd>{companyName || "—"}</dd>
            <dt>Jurisdiction</dt>
            <dd>{incorporation || "—"}</dd>
          </dl>
          <label className="field">
            <span>Contact email</span>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Business activity</span>
            <textarea value={activity} onChange={(e) => setActivity(e.target.value)} required />
          </label>
          <div className="flex gap-3">
            <button className="btn" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={!companyName || !incorporation || !contactEmail || !activity}
            >
              Confirm and find providers
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
