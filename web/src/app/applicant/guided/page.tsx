"use client";

import { useState } from "react";
import Link from "next/link";

const PROMPTS = [
  "What type of account do you need?",
  "Which country is your business incorporated in?",
  "What is your main business activity?",
];

export default function GuidedIntakePage() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [extracted, setExtracted] = useState<string | null>(null);

  const prompt = PROMPTS[index] ?? "Review your questionnaire.";

  function readPrompt() {
    if (!window.speechSynthesis) {
      setVoiceStatus("Read-aloud unavailable in this browser.");
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(prompt);
    u.lang = "en-GB";
    u.rate = 1.1;
    speechSynthesis.speak(u);
    setVoiceStatus("Reading question. Answers are typed; microphone and AI are not connected.");
  }

  function stopPrompt() {
    speechSynthesis.cancel();
    setVoiceStatus("");
  }

  async function saveAnswer() {
    const res = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, answer, field: "guided-intake" }),
    });
    const data = await res.json();
    setExtracted(data.error ?? JSON.stringify(data.value));
    if (index < PROMPTS.length - 1) {
      setIndex(index + 1);
      setAnswer("");
    }
  }

  return (
    <>
      <p className="eyebrow">Guided intake</p>
      <h1>Guided intake</h1>
      <p className="lead">Choose your request, then answer the prompts. You will confirm every field in the questionnaire.</p>
      <div className="notice">
        This prototype reads English prompts aloud and accepts typed answers. Live AI and microphone input are not
        connected unless configured.
      </div>
      <section className="panel">
        <p>{prompt}</p>
        {voiceStatus && <p className="text-sm text-[var(--muted)]">{voiceStatus}</p>}
        <label className="field">
          <span>Your answer</span>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={readPrompt}>
            Read prompt aloud
          </button>
          <button type="button" className="btn" onClick={stopPrompt}>
            Stop audio
          </button>
          <button type="button" className="btn btn-primary" onClick={saveAnswer} disabled={!answer}>
            Save answer
          </button>
          <Link href="/applicant/questionnaire" className="btn">
            Continue in questionnaire
          </Link>
        </div>
        {extracted && (
          <div className="notice mt-4">
            <strong>Proposed value:</strong> {extracted}
          </div>
        )}
      </section>
      <p className="text-sm text-[var(--muted)]">
        <Link href="/applicant/find">Start a new guided intake</Link> from Find a Provider.
      </p>
    </>
  );
}
