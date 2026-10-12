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

  async function saveDraft() {
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
      }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? "Profile prepared for SOPHIMA review. Submitting does not publish — review is required."
        : data.error
    );
  }

  function exportAnswers() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "FinSyndeo-provider-profile.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div>
      <div className="toolbar flex justify-between items-center mb-4">
        <span id="saved">Provider profile · interactive draft</span>
        <button id="export" type="button" className="btn" onClick={exportAnswers}>
          Export answers
        </button>
      </div>
      <nav className="step-nav" aria-label="Institution Apply steps">
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
        Institution Apply · Step {navIndex + 1} of {STEP_LABELS.length}
      </p>
      <h1>{STEP_TITLES[navIndex] ?? STEP_TITLES[0]}</h1>
      <p className="lead">{STEP_LEADS[navIndex] ?? STEP_LEADS[0]}</p>

      {errors.length > 0 && (
        <div className="notice notice-error">
          <strong>Please complete the following:</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <ProviderApplyContent state={state} setState={setState} />

      <div className="flex gap-3 mt-4 actions">
        <button type="button" className="btn" disabled={state.step === 0} onClick={() => go(STEP_ORDER[navIndex - 1] ?? 0, false)}>
          Back
        </button>
        {!isLast ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => go(STEP_ORDER[navIndex + 1] ?? 8)}
          >
            Continue
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={saveDraft}>
            Prepare profile for review
          </button>
        )}
      </div>
      {message && <div className="notice">{message}</div>}
      <p className="preview hint">
        Design preview. Export creates a local file; preparing for review saves a server draft and does not publish.
      </p>
    </div>
  );
}
