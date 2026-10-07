"use client";

import { useState } from "react";
export default function GuidedIntakePage() {
  const [prompt, setPrompt] = useState("What type of account do you need?");
  const [answer, setAnswer] = useState("");
  const [extracted, setExtracted] = useState<string | null>(null);

  async function extract() {
    const res = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, answer, field: "account-type" }),
    });
    const data = await res.json();
    setExtracted(data.error ?? JSON.stringify(data.value));
  }

  return (
    <>
      <p className="eyebrow">Guided intake</p>
      <h1>Guided intake</h1>
      <p className="lead">
        AI-assisted intake uses the same schema as the questionnaire. Typed completion is always available. This assistant is AI.
      </p>
      <div className="notice">
        Voice requires a configured provider. AI extraction runs server-side through the Neon AI Gateway when configured.
      </div>
      <section className="panel">
        <p>{prompt}</p>
        <label className="field">
          <span>Your answer</span>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </label>
        <button className="btn btn-primary mr-3" onClick={extract} disabled={!answer}>
          Extract value
        </button>
        <a href="/applicant/questionnaire" className="btn">
          Switch to questionnaire
        </a>
        {extracted && (
          <div className="notice mt-4">
            <strong>Proposed value:</strong> {extracted}
          </div>
        )}
      </section>
    </>
  );
}
