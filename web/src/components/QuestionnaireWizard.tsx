"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApplicantRouteSelector } from "@/components/questionnaire/ApplicantRouteSelector";
import { PrivateBankingSteps } from "@/components/questionnaire/private-banking/PrivateBankingSteps";
import { PrivateBankingSummary } from "@/components/questionnaire/private-banking/PrivateBankingSummary";
import { CountryMultiSelect } from "@/components/questionnaire/CountryMultiSelect";
import { OnboardingPreferencesPanel } from "@/components/questionnaire/OnboardingPreferencesPanel";
import { FieldRenderer, RadioGroupField } from "@/components/questionnaire/FieldRenderer";
import { buildTypedData } from "@/lib/questionnaire/buildTypedData";
import { buildRenderableStep, fieldStorageKey, getFieldsForStep } from "@/lib/questionnaire/dictionary";
import {
  apiRouteFromValues,
  getQuestionnaireFlow,
  isPersonalFlow,
  resolveDictionaryRoute,
} from "@/lib/questionnaire/flows";
import { stepEyebrow, stepTitleForRoute } from "@/lib/questionnaire/step-meta";
import { validatePrivateBankingStep } from "@/lib/questionnaire/validate-private-banking";
import type { CountryPickers, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";
import { isFieldVisible, isRenderableVisible } from "@/lib/questionnaire/visibility";

const DRAFT_KEY = "finsyndeo-questionnaire-draft-v1";

type Draft = {
  version: 1;
  page: number;
  values: QuestionnaireValues;
  pickers: CountryPickers;
  applicationId?: string;
};

function loadLocalDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d?.version === 1 ? d : null;
  } catch {
    return null;
  }
}

function saveLocalDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function wizardPayload(page: number, values: QuestionnaireValues, pickers: CountryPickers) {
  return {
    wizardDraft: { version: 1 as const, page, values, pickers },
  };
}

function contactValid(values: QuestionnaireValues, personal: boolean): string | null {
  if (personal) {
    if (
      !String(values["pb-name"] ?? "").trim() ||
      !String(values["pb-surname"] ?? "").trim() ||
      !String(values["pb-email"] ?? "").trim()
    ) {
      return "Please enter your name, surname and a valid email address.";
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
    if (values.consent !== true) return "Please confirm you have read the Privacy Notice to continue.";
    return null;
  }
  if (step === 1) {
    if (!String(values.applicant ?? "").trim()) {
      return "Please select who this assessment is for.";
    }
    if (String(values.applicant) === "company" && !String(values["account-type"] ?? "").trim()) {
      return "Please select the service you need.";
    }
    if (isPersonalFlow(values)) {
      return null;
    }
  }
  if (isPersonalFlow(values) && step >= 20 && step <= 23) {
    return validatePrivateBankingStep(step, values, pickers);
  }
  if (step === 1 && !isPersonalFlow(values)) {
    if (!String(values["registration"] ?? "").trim() && values["registration-notissued"] !== true) {
      return "Please enter the company registration number or mark the identifier exception.";
    }
  }
  if (isPersonalFlow(values) && (step === 1 || (step >= 20 && step <= 23))) {
    return null;
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

type WizardProps = { showPageHeader?: boolean; guidedMode?: boolean };

export function QuestionnaireWizard({ showPageHeader, guidedMode }: WizardProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams.get("applicationId");
  const [page, setPage] = useState(0);
  const [values, setValues] = useState<QuestionnaireValues>({});
  const [pickers, setPickers] = useState<CountryPickers>({});
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(urlAppId);
  const [contentHash, setContentHash] = useState<string | undefined>();
  const [serverSaved, setServerSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const creatingRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (urlAppId) {
        try {
          const res = await fetch(`/api/applications/${urlAppId}`);
          const data = await res.json();
          if (res.ok && data.revision?.typedData?.wizardDraft) {
            const wd = data.revision.typedData.wizardDraft as Draft;
            if (!cancelled) {
              setPage(wd.page ?? 0);
              setValues(wd.values ?? {});
              setPickers(wd.pickers ?? {});
              setApplicationId(urlAppId);
              setContentHash(data.revision.contentHash);
              setServerSaved(true);
              setHydrated(true);
              return;
            }
          }
        } catch {
          /* fall through to local */
        }
      }
      const draft = loadLocalDraft();
      if (!cancelled && draft) {
        setPage(draft.page);
        setValues(draft.values);
        setPickers(draft.pickers);
        if (draft.applicationId) setApplicationId(draft.applicationId);
      }
      if (!cancelled) {
        // Prefill contact email from session when empty
        try {
          const me = await fetch("/api/auth/session");
          if (me.ok) {
            const session = await me.json();
            if (session?.user?.email) {
              setValues((prev) =>
                prev["pb-email"] ? prev : { ...prev, "pb-email": session.user.email }
              );
            }
          }
        } catch {
          /* optional */
        }
        setHydrated(true);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [urlAppId]);

  const flow = useMemo(() => getQuestionnaireFlow(values), [values]);
  const route = useMemo(() => resolveDictionaryRoute(values), [values]);
  const personal = isPersonalFlow(values);

  const persistServer = useCallback(
    async (draft: Draft, appId: string, hash?: string) => {
      const res = await fetch(`/api/applications/${appId}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typedData: wizardPayload(draft.page, draft.values, draft.pickers),
          contentHash: hash,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Could not save progress.");
        setServerSaved(false);
        return;
      }
      setContentHash(data.contentHash);
      setServerSaved(true);
      setSaveError("");
    },
    []
  );

  const ensureApplication = useCallback(
    async (draft: Draft): Promise<string | null> => {
      if (applicationId) return applicationId;
      if (creatingRef.current) return null;
      creatingRef.current = true;
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            route: apiRouteFromValues(draft.values) || "bank",
            typedData: wizardPayload(draft.page, draft.values, draft.pickers),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveError(data.error ?? "Could not create draft assessment.");
          return null;
        }
        const id = data.application.id as string;
        setApplicationId(id);
        setContentHash(data.revision?.contentHash);
        setServerSaved(true);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("applicationId", id);
          window.history.replaceState({}, "", url.toString());
        }
        return id;
      } finally {
        creatingRef.current = false;
      }
    },
    [applicationId]
  );

  useEffect(() => {
    if (!hydrated || page === 0) return;
    const draft: Draft = { version: 1, page, values, pickers, applicationId: applicationId ?? undefined };
    saveLocalDraft(draft);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void (async () => {
        const id = await ensureApplication(draft);
        if (id) await persistServer(draft, id, contentHash);
      })();
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [hydrated, page, values, pickers, applicationId, contentHash, ensureApplication, persistServer]);

  useEffect(() => {
    if (!flow.includes(page)) {
      setPage(flow.includes(1) ? 1 : flow[0] ?? 0);
    }
  }, [flow, page]);

  const setValue = useCallback((key: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  function changeApplicantType() {
    setValues((prev) => {
      const next = { ...prev };
      delete next.applicant;
      delete next["account-type"];
      return next;
    });
    setPage(1);
    setServerSaved(false);
  }

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
        if (contact && (page === 5 || target === 40)) {
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
    let appId = applicationId;

    if (appId) {
      const patchRes = await fetch(`/api/applications/${appId}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typedData, contentHash }),
      });
      if (!patchRes.ok) {
        const data = await patchRes.json();
        setError(data.error ?? "Failed to save.");
        return;
      }
    } else {
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
      appId = data.application.id as string;
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }

    const confirmRes = await fetch(`/api/applications/${appId}/revisions`, {
      method: "POST",
    });
    if (!confirmRes.ok) {
      router.push("/applicant/assessments");
      return;
    }
    router.push(`/applicant/results?id=${appId}`);
  }

  const renderables = page === 40 ? [] : buildRenderableStep(route, page);

  function clearDraft() {
    if (
      !confirm(
        "Discard this draft? Answers for this assessment will be deleted. Other assessments and your profile are not affected."
      )
    ) {
      return;
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setValues({});
    setPickers({});
    setPage(0);
    setError("");
    setApplicationId(null);
    setContentHash(undefined);
    setServerSaved(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("applicationId");
      window.history.replaceState({}, "", url.toString());
    }
  }

  const applicantKind = String(values.applicant ?? "");
  const title = stepTitleForRoute(page, personal, applicantKind);

  return (
    <div>
      {showPageHeader && page === 0 && (
        <>
          <p className="eyebrow">{guidedMode ? "AI-guided assessment" : "Questionnaire"}</p>
          <h1>Start your assessment</h1>
          <p className="lead">Tell us what you need. You can save your progress and return later.</p>
          {guidedMode && (
            <p className="text-sm text-[var(--muted)]">
              Typed guidance: answer one step at a time. The same questions, validation and saved assessment are used
              as the questionnaire route.
            </p>
          )}
        </>
      )}
      {hydrated && page > 0 && (
        <div className="draft-state mb-4 text-sm text-[var(--muted)]">
          {serverSaved ? "Progress saved. " : saveError ? `${saveError} ` : "Saving progress… "}
          <button type="button" className="link-btn" onClick={clearDraft}>
            Discard this draft
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
                {i + 1} · {stepTitleForRoute(n, personal, applicantKind)}
              </button>
            ))}
        </nav>
      )}

      {page !== 0 && (
        <>
          <p className="eyebrow">{stepEyebrow(page, personal)}</p>
          <h1>{title}</h1>
        </>
      )}

      {page === 0 && (
        <section className="panel">
          <label className="checkline">
            <input
              type="checkbox"
              checked={values.consent === true}
              onChange={(e) => setValue("consent", e.target.checked)}
            />
            <span>
              I have read the{" "}
              <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Notice
              </Link>
              .
            </span>
          </label>
        </section>
      )}

      {page === 5 && <OnboardingPreferencesPanel values={values} onChange={setValue} />}

      {page !== 0 && page !== 40 && (
        <section className="panel">
          {page === 1 && (
            <ApplicantRouteSelector
              values={values}
              onChange={(key, value) => setValue(key, value)}
            />
          )}
          {personal && [20, 21, 22, 23].includes(page) && (
            <>
              <PrivateBankingSteps
                step={page}
                values={values}
                pickers={pickers}
                onChange={setValue}
                onPickerChange={(id, list) => setPickers((p) => ({ ...p, [id]: list }))}
              />
              <p className="text-sm text-[var(--muted)] mt-4">
                <button type="button" className="link-btn" onClick={changeApplicantType}>
                  Change applicant type
                </button>
              </p>
            </>
          )}
          {!(personal && [1, 20, 21, 22, 23].includes(page)) &&
            renderables
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

      {page === 40 && personal && (
        <>
          <p className="lead">Review your answers before finding potential matches.</p>
          <PrivateBankingSummary values={values} pickers={pickers} onEdit={(s) => go(s)} />
          <label className="checkline">
            <input
              type="checkbox"
              checked={values["pb-accuracy"] === true}
              onChange={(e) => setValue("pb-accuracy", e.target.checked)}
            />
            <span>I confirm that the information I have provided is accurate to the best of my knowledge.</span>
          </label>
        </>
      )}

      {page === 40 && !personal && (
        <section className="panel">
          <p className="lead">Review your answers. Edit any section or confirm to find matching institutions.</p>
          {flow
            .filter((n) => ![0, 1, 40].includes(n))
            .map((n) => (
              <section key={n} className="panel">
                <header className="flex justify-between items-center gap-3">
                  <h2>{stepTitleForRoute(n, personal, applicantKind)}</h2>
                  <button type="button" className="mini" onClick={() => go(n)}>
                    Edit {stepTitleForRoute(n, personal, applicantKind)}
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
          <label className="checkline">
            <input
              type="checkbox"
              checked={values.accuracy === true}
              onChange={(e) => setValue("accuracy", e.target.checked)}
            />
            <span>I confirm that the information I have provided is accurate to the best of my knowledge.</span>
          </label>
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
            Confirm & find potential matches
          </button>
        )}
      </div>
    </div>
  );
}
