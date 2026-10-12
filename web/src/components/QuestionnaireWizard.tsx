"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import { FieldRenderer, RadioGroupField } from "@/components/questionnaire/FieldRenderer";
import { buildTypedData } from "@/lib/questionnaire/buildTypedData";
import { buildRenderableStep, fieldStorageKey, getFieldsForStep } from "@/lib/questionnaire/dictionary";
import {
  apiRouteFromValues,
  getQuestionnaireFlow,
  isPersonalFlow,
  resolveDictionaryRoute,
} from "@/lib/questionnaire/flows";
import { stepEyebrow, stepTitle } from "@/lib/questionnaire/step-meta";
import type { CountryPickers, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";
import { isFieldVisible, isRenderableVisible } from "@/lib/questionnaire/visibility";

const DRAFT_KEY = "finsyndeo-questionnaire-draft-v1";

type Draft = {
  version: 1;
  page: number;
  values: QuestionnaireValues;
  pickers: CountryPickers;
};

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d?.version === 1 ? d : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function contactValid(values: QuestionnaireValues, personal: boolean): string | null {
  if (personal) {
    if (!String(values["pb-name"] ?? "").trim() || !String(values["pb-email"] ?? "").trim()) {
      return "Please enter your name and a valid email address.";
    }
    return null;
  }
  if (!String(values["contact-name"] ?? "").trim() || !String(values["contact-email"] ?? "").trim()) {
    return "Please enter contact name and email.";
  }
  if (!String(values["representative-role"] ?? "").trim()) {
    return "Please provide your relationship to the entity.";
  }
  if (values["representative-authority"] !== true) {
    return "Please confirm your authority to act.";
  }
  return null;
}

function validateStepFields(
  route: ReturnType<typeof resolveDictionaryRoute>,
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): string | null {
  if (step === 0) {
    if (values.consent !== true) return "Please accept the Privacy Notice to continue.";
    return null;
  }
  if (step === 1 && !isPersonalFlow(values)) {
    if (!String(values["registration"] ?? "").trim() && values["registration-notissued"] !== true) {
      return "Please enter the company registration number or mark the identifier exception.";
    }
  }
  const fields = getFieldsForStep(route, step).filter((f) => isFieldVisible(f, values));
  for (const field of fields) {
    if (!field.required || field.type === "hidden") continue;
    const key = fieldStorageKey(field);
    const val = values[key];
    if (field.type === "checkbox") {
      if (field.required && val !== true) return `Please complete: ${field.label}`;
    } else if (!String(val ?? "").trim()) {
      return `Please complete: ${field.label}`;
    }
  }
  for (const [pickerId, list] of Object.entries(pickers)) {
    const field = fields.find((f) => f.id === pickerId);
    if (field?.required && (!list || !list.length)) {
      return `Please select countries for ${pickerId}.`;
    }
  }
  return null;
}

export function QuestionnaireWizard() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [values, setValues] = useState<QuestionnaireValues>({});
  const [pickers, setPickers] = useState<CountryPickers>({});
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setPage(draft.page);
      setValues(draft.values);
      setPickers(draft.pickers);
    }
    setHydrated(true);
  }, []);

  const flow = useMemo(() => getQuestionnaireFlow(values), [values]);
  const route = useMemo(() => resolveDictionaryRoute(values), [values]);
  const personal = isPersonalFlow(values);

  useEffect(() => {
    if (!hydrated) return;
    saveDraft({ version: 1, page, values, pickers });
  }, [hydrated, page, values, pickers]);

  useEffect(() => {
    if (!flow.includes(page)) {
      setPage(flow.includes(1) ? 1 : flow[0] ?? 0);
    }
  }, [flow, page]);

  const setValue = useCallback((key: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pos = flow.indexOf(page);
  const prevPage = pos > 0 ? flow[pos - 1] : null;
  const nextPage = pos >= 0 && pos < flow.length - 1 ? flow[pos + 1] : null;

  function go(target: number) {
    setError("");
    if (flow.indexOf(target) > flow.indexOf(page)) {
      const msg = validateStepFields(route, page, values, pickers);
      if (msg) {
        setError(msg);
        return;
      }
      if ((target === 40 || target === 5) && page !== 40) {
        const contact = contactValid(values, personal);
        if (contact && (page === 5 || page === 24 || target === 40)) {
          setError(contact);
          return;
        }
      }
    }
    setPage(target);
    window.scrollTo(0, 0);
  }

  async function submit() {
    setError("");
    const contact = contactValid(values, personal);
    if (contact) {
      setError(contact);
      return;
    }
    if (values.accuracy !== true && !personal) {
      setError("Please confirm the accuracy of your assessment.");
      return;
    }
    if (personal && values["pb-accuracy"] !== true) {
      setError("Please confirm the accuracy of your assessment.");
      return;
    }

    const typedData = buildTypedData(values, pickers);
    const apiRoute = apiRouteFromValues(values);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: apiRoute, typedData }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
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

  const renderables = page === 40 ? [] : buildRenderableStep(route, page);

  function clearDraft() {
    if (!confirm("Clear this draft and start again?")) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setValues({});
    setPickers({});
    setPage(0);
    setError("");
  }

  return (
    <div>
      {hydrated && (
        <div className="draft-state mb-4">
          Draft saved in this browser.{" "}
          <button type="button" className="mini" onClick={clearDraft}>
            Clear saved draft
          </button>
        </div>
      )}
      {error && <div className="notice notice-error">{error}</div>}

      {page !== 0 && page !== 40 && (
        <nav className="step-nav" aria-label="Assessment steps">
          {flow
            .filter((n) => n !== 0 && n !== 40)
            .map((n, i) => (
              <button
                key={n}
                type="button"
                className={`step-nav-btn ${n === page ? "step-nav-current" : ""}`}
                aria-current={n === page ? "step" : undefined}
                onClick={() => go(n)}
              >
                {i + 1} · {stepTitle(n)}
              </button>
            ))}
        </nav>
      )}

      <p className="eyebrow">{stepEyebrow(page, personal)}</p>
      <h1>{stepTitle(page)}</h1>

      {page === 0 && (
        <section className="panel">
          <p className="lead">Start your assessment. Your answers are saved in this browser as a draft.</p>
          <FieldRenderer
            field={{
              key: "id:consent",
              id: "consent",
              step: "0",
              label:
                "I agree to the processing of my information for assessment, matching and due diligence under the Privacy Notice.",
              type: "checkbox",
              required: true,
            }}
            values={values}
            onChange={setValue}
          />
        </section>
      )}

      {page !== 0 && page !== 40 && (
        <section className="panel">
          {renderables
            .filter((item) => isRenderableVisible(item, values))
            .map((item) => {
              if (item.kind === "country-picker") {
                return (
                  <CountryMultiSelect
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    required={item.required}
                    value={pickers[item.id] ?? []}
                    onChange={(next) => setPickers((p) => ({ ...p, [item.id]: next }))}
                  />
                );
              }
              if (item.kind === "radio-group") {
                return (
                  <RadioGroupField
                    key={item.name}
                    name={item.name}
                    legend={item.legend}
                    options={item.options}
                    values={values}
                    onChange={setValue}
                    required={item.required}
                  />
                );
              }
              if (!isFieldVisible(item.field, values)) return null;
              return (
                <FieldRenderer
                  key={item.field.key}
                  field={item.field}
                  values={values}
                  onChange={setValue}
                  step={page}
                />
              );
            })}
        </section>
      )}

      {page === 40 && (
        <section className="panel">
          <p className="lead">Review your answers. Edit any section or confirm to find matching institutions.</p>
          {flow
            .filter((n) => ![0, 1, 40].includes(n))
            .map((n) => (
              <section key={n} className="panel">
                <header className="flex justify-between items-center gap-3">
                  <h2>{stepTitle(n)}</h2>
                  <button type="button" className="mini" onClick={() => go(n)}>
                    Edit {stepTitle(n)}
                  </button>
                </header>
                <dl className="summary">
                  {getFieldsForStep(route, n)
                    .filter((f) => f.type !== "hidden" && isFieldVisible(f, values))
                    .slice(0, 12)
                    .map((f) => {
                      const key = fieldStorageKey(f);
                      const val = values[key];
                      if (f.type === "checkbox") {
                        if (val !== true) return null;
                        return (
                          <div key={f.key} className="contents">
                            <dt>{f.label}</dt>
                            <dd>Yes</dd>
                          </div>
                        );
                      }
                      const text = Array.isArray(val) ? val.join(", ") : String(val ?? "").trim();
                      if (!text) return null;
                      return (
                        <div key={f.key} className="contents">
                          <dt>{f.label}</dt>
                          <dd>{text}</dd>
                        </div>
                      );
                    })}
                </dl>
              </section>
            ))}
          {!personal && (
            <label className="checkline">
              <input
                type="checkbox"
                checked={values.accuracy === true}
                onChange={(e) => setValue("accuracy", e.target.checked)}
              />
              <span>I confirm that the information I have provided is accurate to the best of my knowledge.</span>
            </label>
          )}
          {personal && (
            <label className="checkline">
              <input
                type="checkbox"
                checked={values["pb-accuracy"] === true}
                onChange={(e) => setValue("pb-accuracy", e.target.checked)}
              />
              <span>I confirm that the information I have provided is accurate to the best of my knowledge.</span>
            </label>
          )}
        </section>
      )}

      <div className="actions">
        {page !== 0 && (
          <button type="button" className="btn" onClick={() => (prevPage !== null ? go(prevPage) : undefined)}>
            Back
          </button>
        )}
        {page === 0 && (
          <button type="button" className="btn btn-primary" disabled={values.consent !== true} onClick={() => go(1)}>
            Continue
          </button>
        )}
        {page > 0 && page !== 40 && nextPage !== null && (
          <button type="button" className="btn btn-primary" onClick={() => go(nextPage)}>
            {nextPage === 40 ? "Review my assessment" : "Continue"}
          </button>
        )}
        {page === 40 && (
          <button type="button" className="btn btn-primary" onClick={submit}>
            Confirm & find matching institutions
          </button>
        )}
      </div>
    </div>
  );
}
