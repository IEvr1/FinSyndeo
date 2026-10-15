"use client";

import { useEffect, useState } from "react";
import { ProviderApplyContent } from "@/components/provider-apply/ProviderApplyContent";
import {
  DRAFT_STORAGE_KEY,
  STEP_LABELS,
  STEP_LEADS,
  STEP_ORDER,
  STEP_TITLES,
} from "@/lib/provider-apply/config";
import { providerStateToProfileData } from "@/lib/provider-apply/profile-mapper";
import { createInitialProviderState, ensureOfferArrays } from "@/lib/provider-apply/state";
import type { ProviderDraftState } from "@/lib/provider-apply/types";
import { validateAllProviderSteps, validateCurrentStep } from "@/lib/provider-apply/validation";

function loadState(): ProviderDraftState {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createInitialProviderState();
    const parsed = JSON.parse(raw) as ProviderDraftState;
    if (parsed?.version !== 1) return createInitialProviderState();
    if (parsed.step === 6) parsed.step = 7;
    if (parsed.step === 4) parsed.step = 3;
    return ensureOfferArrays(parsed);
  } catch {
    return createInitialProviderState();
  }
}

function saveLocal(state: ProviderDraftState) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function ProviderProfileWizard() {
  const [state, setState] = useState<ProviderDraftState>(createInitialProviderState);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveLocal(state);
  }, [state, hydrated]);

  const navIndex = STEP_ORDER.indexOf(state.step as (typeof STEP_ORDER)[number]);
  const isLast = state.step === 8;

  function go(step: number, validate = true) {
    if (validate && step > state.step) {
      const missing = validateCurrentStep(state);
      if (missing.length) {
        setErrors(missing);
        return;
      }
    }
    setErrors([]);
    setState((s) => ({ ...s, step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitProfile() {
    const missing = validateAllProviderSteps(state);
    if (missing.length) {
      setErrors(missing);
      setMessage("");
      return;
    }

    const res = await fetch("/api/providers/profile/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName: state.core.legalName,
        country: state.core.country,
        profileData: providerStateToProfileData(state, { id: "local", code: "local" }),
        wizardState: state,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmitted(true);
      setMessage(
        "Your profile has been submitted to SOPHIMA for review. It will become available for matching only after approval and verification of a current referral agreement."
      );
    } else {
      setMessage(data.error ?? "Submission failed.");
    }
  }

  async function downloadResponses() {
    const status = submitted ? "Submitted for review" : "Draft";
    const res = await fetch("/api/providers/profile/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, status }),
    });
    if (!res.ok) return;
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `FinSyndeo-provider-responses.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div>
      <div className="toolbar flex justify-between items-center mb-4">
        <span id="saved">Institution profile · {submitted ? "Submitted for review" : "Draft"}</span>
        <button id="export" type="button" className="btn" onClick={downloadResponses}>
          Download my responses
        </button>
      </div>
      <nav className="step-nav" aria-label="Institution profile steps">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`step-nav-btn ${STEP_ORDER[i] === state.step ? "step-nav-current" : ""}`}
            aria-current={STEP_ORDER[i] === state.step ? "step" : undefined}
            onClick={() => go(STEP_ORDER[i], false)}
          >
            {i + 1} · {label}
          </button>
        ))}
      </nav>
      <p className="eyebrow">
        Institution profile · Step {navIndex + 1} of {STEP_LABELS.length}
      </p>
      <h1>{STEP_TITLES[navIndex] ?? STEP_TITLES[0]}</h1>
      <p className="lead">{STEP_LEADS[navIndex] ?? STEP_LEADS[0]}</p>

      {errors.length > 0 && (
        <div className="notice notice-error" role="alert">
          <strong>Your profile is not ready to submit. Please complete the highlighted sections below.</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <ProviderApplyContent state={state} setState={setState} onGoToStep={(s) => go(s, false)} />

      <div className="flex gap-3 actions">
        <button
          type="button"
          className="btn"
          disabled={state.step === 0}
          onClick={() => go(STEP_ORDER[navIndex - 1] ?? 0, false)}
        >
          Back
        </button>
        {!isLast ? (
          <button type="button" className="btn btn-primary" onClick={() => go(STEP_ORDER[navIndex + 1] ?? 8)}>
            Continue
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={submitProfile}>
            Submit profile to SOPHIMA
          </button>
        )}
      </div>
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
