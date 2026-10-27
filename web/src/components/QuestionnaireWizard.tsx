"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApplicantRouteSelector } from "@/components/questionnaire/ApplicantRouteSelector";
import { CorrespondentSteps } from "@/components/questionnaire/correspondent/CorrespondentSteps";
import { CorrespondentSummary } from "@/components/questionnaire/correspondent/CorrespondentSummary";
import { FinancingSteps } from "@/components/questionnaire/financing/FinancingSteps";
import { FinancingSummary } from "@/components/questionnaire/financing/FinancingSummary";
import { LegalEntityBankSteps } from "@/components/questionnaire/legal-entity-bank/LegalEntityBankSteps";
import { LegalEntityBankSummary } from "@/components/questionnaire/legal-entity-bank/LegalEntityBankSummary";
import { MerchantSteps } from "@/components/questionnaire/merchant/MerchantSteps";
import { MerchantSummary } from "@/components/questionnaire/merchant/MerchantSummary";
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
  isLegalEntityBankFlow,
  isMerchantFlow,
  isPersonalFlow,
  resolveDictionaryRoute,
} from "@/lib/questionnaire/flows";
import { stepEyebrow, stepTitleForRoute } from "@/lib/questionnaire/step-meta";
import {
  validateCorrespondentFields,
  validateCorrespondentStep,
} from "@/lib/questionnaire/validate-correspondent";
import {
  validateFinancingFields,
  validateFinancingStep,
} from "@/lib/questionnaire/validate-financing";
import {
  isLegalEntityBankStep,
  validateLegalEntityBankAll,
  validateLegalEntityBankFields,
  validateLegalEntityBankStep,
} from "@/lib/questionnaire/validate-legal-entity-bank";
import {
  validateMerchantFields,
  validateMerchantStep,
} from "@/lib/questionnaire/validate-merchant";
import {
  validatePrivateBankingFields,
  validatePrivateBankingStep,
} from "@/lib/questionnaire/validate-private-banking";
import type { CountryPickers, FieldValue, QuestionnaireValues } from "@/lib/questionnaire/types";
import { isFieldVisible, isRenderableVisible } from "@/lib/questionnaire/visibility";

function isFinancingFlow(values: QuestionnaireValues): boolean {
  return String(values.applicant ?? "") === "company" && String(values["account-type"] ?? "") === "financing";
}

function isCorrespondentFlow(values: QuestionnaireValues): boolean {
  return String(values.applicant ?? "") === "institution";
}

const CO_CUSTOM_STEPS = [1, 30, 31, 32, 33, 39, 4] as const;
/** Merchant custom UI steps (entity step 1 still uses dictionary + FieldRenderer filters). */
const MERCHANT_CUSTOM_STEPS = [2, 3, 4, 7, 8, 9, 10, 11] as const;

function focusFirstFieldError(fieldId?: string) {
  if (!fieldId || typeof document === "undefined") return;
  const el =
    document.querySelector(`[data-field="${fieldId}"]`) ||
    document.getElementById(fieldId) ||
    document.querySelector(`#${CSS.escape(fieldId)}`);
  if (el && "scrollIntoView" in el) {
    (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = (el as HTMLElement).querySelector("input, select, textarea, button");
    if (focusable && focusable instanceof HTMLElement) focusable.focus();
  }
}

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
  if (isLegalEntityBankFlow(values) && isLegalEntityBankStep(step)) {
    return validateLegalEntityBankStep(step, values, pickers);
  }
  if (isCorrespondentFlow(values) && (CO_CUSTOM_STEPS as readonly number[]).includes(step)) {
    return validateCorrespondentStep(step, values, pickers);
  }
  if (isFinancingFlow(values) && [1, 2, 4, 5, 12, 13, 14, 39].includes(step)) {
    return validateFinancingStep(step, values, pickers);
  }
  if (isMerchantFlow(values) && [1, 2, 3, 4, 5, 7, 8, 9, 10, 11].includes(step)) {
    return validateMerchantStep(step, values, pickers);
  }
  if (step === 1 && !isPersonalFlow(values) && !isCorrespondentFlow(values) && !isMerchantFlow(values)) {
    if (!String(values["registration"] ?? "").trim() && values["registration-notissued"] !== true) {
      return "Please enter the company registration number or mark the identifier exception.";
    }
  }
  if (isPersonalFlow(values) && (step === 1 || (step >= 20 && step <= 23))) {
    return null;
  }
  if (isCorrespondentFlow(values) && (CO_CUSTOM_STEPS as readonly number[]).includes(step)) {
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [revisionConflict, setRevisionConflict] = useState(false);
  const creatingRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAnswersRef = useRef<{ values: QuestionnaireValues; pickers: CountryPickers; page: number } | null>(
    null
  );

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
        const msg = data.error ?? "Could not save progress.";
        setSaveError(msg);
        setServerSaved(false);
        if (res.status === 409 || /revision conflict/i.test(msg)) {
          pendingAnswersRef.current = {
            values: draft.values,
            pickers: draft.pickers,
            page: draft.page,
          };
          setRevisionConflict(true);
        }
        return;
      }
      setContentHash(data.contentHash);
      setServerSaved(true);
      setSaveError("");
      setRevisionConflict(false);
      pendingAnswersRef.current = null;
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

  const pos = flow.indexOf(page);
  const prevPage = pos > 0 ? flow[pos - 1] : null;
  const nextPage = pos >= 0 && pos < flow.length - 1 ? flow[pos + 1] : null;

  function go(target: number) {
    setError("");
    setFieldErrors({});
    if (flow.indexOf(target) > flow.indexOf(page)) {
      if (personal && page >= 20 && page <= 23) {
        const result = validatePrivateBankingFields(page, values, pickers);
        if (result) {
          setError(result.message);
          setFieldErrors(result.fields);
          focusFirstFieldError(result.firstField);
          return;
        }
      } else if (isLegalEntityBankFlow(values) && isLegalEntityBankStep(page)) {
        const result = validateLegalEntityBankFields(page, values, pickers);
        if (result) {
          setError(result.message);
          setFieldErrors(result.fields);
          focusFirstFieldError(result.firstField);
          return;
        }
      } else if (isCorrespondentFlow(values) && (CO_CUSTOM_STEPS as readonly number[]).includes(page)) {
        const result = validateCorrespondentFields(page, values, pickers);
        if (result) {
          setError(result.message);
          setFieldErrors(result.fields);
          focusFirstFieldError(result.firstField);
          return;
        }
      } else if (isFinancingFlow(values) && [1, 2, 4, 5, 12, 13, 14, 39].includes(page)) {
        const result = validateFinancingFields(page, values, pickers);
        if (result) {
          setError(result.message);
          setFieldErrors(result.fields);
          focusFirstFieldError(result.firstField);
          return;
        }
      } else if (isMerchantFlow(values) && [1, 2, 3, 4, 5, 7, 8, 9, 10, 11].includes(page)) {
        const result = validateMerchantFields(page, values, pickers);
        if (result) {
          setError(result.message);
          setFieldErrors(result.fields);
          focusFirstFieldError(result.firstField);
          return;
        }
      } else {
        const msg = validateStepFields(route, page, values, pickers);
        if (msg) {
          setError(msg);
          return;
        }
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

  async function keepLocalAnswersAndRetrySave() {
    if (!applicationId || !pendingAnswersRef.current) return;
    const pending = pendingAnswersRef.current;
    const res = await fetch(`/api/applications/${applicationId}`);
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error ?? "Could not load the latest saved revision.");
      return;
    }
    const serverHash = data.revision?.contentHash as string | undefined;
    setContentHash(serverHash);
    const draft: Draft = {
      version: 1,
      page: pending.page,
      values: pending.values,
      pickers: pending.pickers,
      applicationId,
    };
    await persistServer(draft, applicationId, serverHash);
  }

  async function loadServerRevisionKeepingNothing() {
    if (!applicationId) return;
    const res = await fetch(`/api/applications/${applicationId}`);
    const data = await res.json();
    if (!res.ok || !data.revision?.typedData?.wizardDraft) {
      setSaveError(data.error ?? "Could not load the server revision.");
      return;
    }
    const wd = data.revision.typedData.wizardDraft as Draft;
    setPage(wd.page ?? page);
    setValues(wd.values ?? {});
    setPickers(wd.pickers ?? {});
    setContentHash(data.revision.contentHash);
    setServerSaved(true);
    setSaveError("");
    setRevisionConflict(false);
    pendingAnswersRef.current = null;
  }

  async function submit() {
    setError("");
    if (isLegalEntityBankFlow(values)) {
      // LE19: validate every active step before saving the final assessment.
      const failing = validateLegalEntityBankAll(values, pickers);
      if (failing) {
        setError(failing.result.message);
        setFieldErrors(failing.result.fields);
        setPage(failing.step);
        window.scrollTo(0, 0);
        return;
      }
    }
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
  const correspondent = isCorrespondentFlow(values);
  const leBank = isLegalEntityBankFlow(values);
  const merchant = isMerchantFlow(values);
  const accountKind = String(values["account-type"] ?? "");
  const title = stepTitleForRoute(page, personal, applicantKind, accountKind);

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
      {revisionConflict && (
        <div className="notice notice-error mb-4">
          <p>
            Your latest changes have not been confirmed saved because another revision was saved meanwhile. Your
            current answers are still here.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <button type="button" className="btn btn-primary" onClick={() => void keepLocalAnswersAndRetrySave()}>
              Keep my answers and save again
            </button>
            <button type="button" className="btn" onClick={() => void loadServerRevisionKeepingNothing()}>
              Load the latest saved version
            </button>
          </div>
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
                {i + 1} · {stepTitleForRoute(n, personal, applicantKind, accountKind)}
              </button>
            ))}
        </nav>
      )}

      {page !== 0 && (
        <>
          <p className="eyebrow">{stepEyebrow(page, personal, leBank)}</p>
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

      {page === 5 && !isFinancingFlow(values) && (
        <OnboardingPreferencesPanel
          values={values}
          onChange={setValue}
          hideOtherMethod={correspondent || leBank || merchant}
        />
      )}
      {page === 5 && isFinancingFlow(values) && (
        <section className="panel">
          <label className="field">
            <span>Preferred relationship-manager language</span>
            <select
              value={String(values["relationship-manager-language"] ?? "")}
              onChange={(e) => setValue("relationship-manager-language", e.target.value)}
            >
              <option value="">Not specified</option>
              {["English", "Greek", "French", "German", "Spanish", "Italian", "Hebrew", "Arabic", "Other"].map(
                (l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                )
              )}
            </select>
          </label>
          {String(values["relationship-manager-language"]) === "Other" && (
            <label className="field" data-field="relationship-manager-language-other">
              <span>Please specify the language</span>
              <input
                value={String(values["relationship-manager-language-other"] ?? "")}
                onChange={(e) => setValue("relationship-manager-language-other", e.target.value)}
              />
            </label>
          )}
        </section>
      )}

      {page !== 0 && page !== 40 && (
        <section className="panel">
          {page === 1 && (
            <ApplicantRouteSelector
              values={values}
              onChange={(key, value) => setValue(key, value)}
              hideChangeApplicantType={isFinancingFlow(values) || correspondent || merchant}
            />
          )}
          {personal && [20, 21, 22, 23].includes(page) && (
            <PrivateBankingSteps
              step={page}
              values={values}
              pickers={pickers}
              onChange={setValue}
              onPickerChange={(id, list) => setPickers((p) => ({ ...p, [id]: list }))}
              fieldErrors={fieldErrors}
            />
          )}
          {leBank && isLegalEntityBankStep(page) && (
            <LegalEntityBankSteps
              step={page}
              values={values}
              pickers={pickers}
              onChange={setValue}
              onPickerChange={(id, list) => setPickers((p) => ({ ...p, [id]: list }))}
              fieldErrors={fieldErrors}
            />
          )}
          {merchant && (MERCHANT_CUSTOM_STEPS as readonly number[]).includes(page) && (
            <MerchantSteps
              step={page}
              values={values}
              pickers={pickers}
              onChange={setValue}
              onPickerChange={(id, list) => setPickers((p) => ({ ...p, [id]: list }))}
              fieldErrors={fieldErrors}
            />
          )}
          {correspondent && (CO_CUSTOM_STEPS as readonly number[]).includes(page) && (
            <CorrespondentSteps
              step={page}
              values={values}
              pickers={pickers}
              onChange={setValue}
              onPickerChange={(id, list) => setPickers((p) => ({ ...p, [id]: list }))}
              fieldErrors={fieldErrors}
            />
          )}
          {isFinancingFlow(values) && page === 4 && (
            <p className="hint mb-4">
              {String(values["entity-type"] ?? "").includes("Partnership") ||
              String(values["entity-type"] ?? "").includes("LLP")
                ? "For partnerships and LLPs, describe partner/member and ultimate-controller facts. Fixed economic interests may use percentages; otherwise use managing/control roles without inventing share percentages. No personal beneficial-owner names or identity documents are requested at this stage."
                : "Record natural-person beneficial ownership of the applicant company with nationality and residence. Aim for at least 75% initial-assessment coverage, or explain if unavailable. No personal names or identity documents are requested at this stage. A corporate shareholder is not the UBO."}
            </p>
          )}
          {isFinancingFlow(values) && page === 2 && (
            <>
              <label className="field" data-field="finance-website-status">
                <span>Company website</span>
                <select
                  value={String(values["finance-website-status"] ?? "")}
                  onChange={(e) => setValue("finance-website-status", e.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="available">Website available</option>
                  <option value="under_development">Under development</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </label>
              {String(values["finance-website-status"]) === "available" && (
                <label className="field" data-field="website">
                  <span>Website URL</span>
                  <input
                    type="url"
                    value={String(values.website ?? "")}
                    onChange={(e) => setValue("website", e.target.value)}
                    placeholder="https://"
                  />
                </label>
              )}
              {String(values.licence) === "Yes" && (
                <div className="mt-4">
                  <label className="field" data-field="finance-licence-name">
                    <span>Licence or authorisation name</span>
                    <input
                      value={String(values["finance-licence-name"] ?? "")}
                      onChange={(e) => setValue("finance-licence-name", e.target.value)}
                    />
                  </label>
                  <label className="field" data-field="finance-licence-number">
                    <span>Reference / number</span>
                    <input
                      value={String(values["finance-licence-number"] ?? "")}
                      onChange={(e) => setValue("finance-licence-number", e.target.value)}
                    />
                  </label>
                  <label className="field" data-field="finance-licence-authority">
                    <span>Issuing authority</span>
                    <input
                      value={String(values["finance-licence-authority"] ?? "")}
                      onChange={(e) => setValue("finance-licence-authority", e.target.value)}
                    />
                  </label>
                  <label className="field" data-field="finance-licence-jurisdiction">
                    <span>Jurisdiction</span>
                    <input
                      value={String(values["finance-licence-jurisdiction"] ?? "")}
                      onChange={(e) => setValue("finance-licence-jurisdiction", e.target.value)}
                    />
                  </label>
                </div>
              )}
              <p className="hint mb-4">
                Without a usable website, describe products/services, customers and revenue model in the activity
                field. Shipping industry and financing purpose are separate facts.
              </p>
            </>
          )}
          {isFinancingFlow(values) && [12, 13, 14].includes(page) && (
            <FinancingSteps step={page} values={values} onChange={setValue} fieldErrors={fieldErrors} />
          )}
          {isFinancingFlow(values) && page === 39 && (
            <>
              <label className="field" data-field="finance-existing-banking">
                <span>Does the company have an existing banking relationship?</span>
                <select
                  value={String(values["finance-existing-banking"] ?? values["existing-banking"] ?? "")}
                  onChange={(e) => {
                    setValue("finance-existing-banking", e.target.value);
                    setValue("existing-banking", e.target.value);
                  }}
                >
                  <option value="">Select…</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Previously held now closed">Previously held now closed</option>
                </select>
              </label>
              {(String(values["finance-existing-banking"] ?? values["existing-banking"] ?? "") === "Yes" ||
                String(values["finance-existing-banking"] ?? values["existing-banking"] ?? "") ===
                  "Previously held now closed") && (
                <>
                  <label className="field" data-field="bank-name">
                    <span>Bank name</span>
                    <input
                      value={String(values["bank-name"] ?? "")}
                      onChange={(e) => setValue("bank-name", e.target.value)}
                    />
                  </label>
                  <label className="field" data-field="bank-country">
                    <span>Bank country</span>
                    <input
                      value={String(values["bank-country"] ?? "")}
                      onChange={(e) => setValue("bank-country", e.target.value)}
                      list="finance-bank-countries"
                    />
                    <datalist id="finance-bank-countries">
                      {/* filled via FieldRenderer countries elsewhere; free text accepted */}
                    </datalist>
                  </label>
                </>
              )}
            </>
          )}
          {!(personal && [1, 20, 21, 22, 23].includes(page)) &&
            !(leBank && isLegalEntityBankStep(page)) &&
            !(merchant && (MERCHANT_CUSTOM_STEPS as readonly number[]).includes(page)) &&
            !(correspondent && (CO_CUSTOM_STEPS as readonly number[]).includes(page)) &&
            !(isFinancingFlow(values) && [12, 13, 14, 39].includes(page)) &&
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
                    legend={
                      isFinancingFlow(values) && item.name === "licence"
                        ? "Does this activity require a licence or authorisation?"
                        : item.legend
                    }
                    options={item.options}
                    values={values}
                    onChange={setValue}
                    required={item.required}
                  />
                );
              }
              if (!isFieldVisible(item.field, values)) return null;
              const field =
                isFinancingFlow(values) && item.field.label === "Group name"
                  ? { ...item.field, required: false, label: "Group name" }
                  : item.field;
              return (
                <FieldRenderer
                  key={item.field.key}
                  field={field}
                  values={values}
                  onChange={setValue}
                  step={page}
                  hideOptionalMarker={isFinancingFlow(values)}
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

      {page === 40 && !personal && isFinancingFlow(values) && (
        <section className="panel">
          <FinancingSummary values={values} pickers={pickers} onEdit={(s) => go(s)} />
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

      {page === 40 && !personal && correspondent && (
        <section className="panel">
          <p className="lead">Review your answers before finding potential matches.</p>
          <CorrespondentSummary values={values} pickers={pickers} onEdit={(s) => go(s)} />
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

      {page === 40 && !personal && leBank && (
        <>
          <p className="lead">Review your answers. Edit any section or confirm to find matching institutions.</p>
          <LegalEntityBankSummary values={values} pickers={pickers} onEdit={(s) => go(s)} />
          <label className="checkline">
            <input
              type="checkbox"
              checked={values.accuracy === true}
              onChange={(e) => setValue("accuracy", e.target.checked)}
            />
            <span>I confirm that the information I have provided is accurate to the best of my knowledge.</span>
          </label>
        </>
      )}

      {page === 40 && !personal && merchant && (
        <section className="panel">
          <p className="lead">Review your answers. Edit any section or confirm to find matching institutions.</p>
          <MerchantSummary values={values} pickers={pickers} onEdit={(s) => go(s)} />
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

      {page === 40 && !personal && !isFinancingFlow(values) && !correspondent && !leBank && !merchant && (
        <section className="panel">
          <p className="lead">Review your answers. Edit any section or confirm to find matching institutions.</p>
          {flow
            .filter((n) => ![0, 1, 40].includes(n))
            .map((n) => (
              <section key={n} className="panel">
                <header className="flex justify-between items-center gap-3">
                  <h2>{stepTitleForRoute(n, personal, applicantKind, accountKind)}</h2>
                  <button type="button" className="mini" onClick={() => go(n)}>
                    Edit {stepTitleForRoute(n, personal, applicantKind, accountKind)}
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
