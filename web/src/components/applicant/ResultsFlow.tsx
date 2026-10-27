"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientJourneySteps } from "@/components/ClientJourneySteps";

type MatchRow = {
  provider: string;
  providerCode?: string;
  providerCountry?: string;
  institutionLegalName?: string;
  status: string;
  score: number | null;
  coverage: number;
  essential?: boolean;
  conditional?: boolean;
  reason?: string;
  coverageStatus?: string;
  coverageNote?: string;
};

type IntroRequest = {
  id: string;
  providerId: string;
  status: string;
  paymentStatus: string;
  entitlementType: string;
};

const SORTS = [
  ["match", "Highest SOPHIMA AI match"],
  ["country", "Jurisdiction"],
  ["status", "Eligibility"],
] as const;

function scoreLabel(score: number | null): string {
  if (score == null) return "Match score unavailable";
  return `${score}%`;
}

function providerOptionLabel(index: number): string {
  return `Provider option ${index + 1}`;
}

/** Contract coverage labels (M03): Complete potential fit / Partial coverage / Needs clarification. */
function statusHeadline(row: { status: string; coverageStatus?: string }): string {
  const { status, coverageStatus } = row;
  if (coverageStatus === "Partial coverage") return "Partial coverage";
  if (status === "eligible") return "Complete potential fit";
  if (status === "conditional") return coverageStatus || "Needs clarification";
  return coverageStatus || status;
}

function isShownMatch(row: { status: string; coverageStatus?: string }): boolean {
  return row.status === "eligible" || row.status === "conditional" || row.coverageStatus === "Partial coverage";
}

function fmtFee(requiresPayment: boolean): string {
  return requiresPayment ? "EUR 250.00 introduction fee" : "Included in your introduction allowance";
}

function introStatusLabel(status: string): string {
  switch (status) {
    case "requested":
      return "Introduction requested — release checks pending";
    case "awaiting_payment":
      return "Awaiting payment";
    case "released":
    case "sent":
      return "Introduction sent";
    case "institution_reviewing":
      return "Institution reviewing";
    case "positive_response":
      return "Positive response — onboarding may proceed";
    case "declined":
    case "rejected":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function ResultsFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const view = params.get("view") ?? "results";
  const providerId = params.get("provider");
  const introId = params.get("intro");

  const [matches, setMatches] = useState<{
    matches: MatchRow[];
    eligibleCount: number;
    conditionalCount: number;
    partialCount?: number;
  } | null>(null);
  const [requests, setRequests] = useState<IntroRequest[]>([]);
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("match");
  const [compare, setCompare] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [institution, setInstitution] = useState("");
  const [recipient, setRecipient] = useState("");
  const [introTerms, setIntroTerms] = useState(false);
  const [sharingDone, setSharingDone] = useState(false);

  const loadMatches = useCallback(() => {
    if (!id) return;
    fetch(`/api/applications/${id}/matches`, { method: "POST" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setMatches(d);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const loadRequests = useCallback(() => {
    if (!id) return;
    fetch(`/api/applications/${id}/introduction-requests`)
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) setRequests(d.requests ?? []);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (view === "results" || view === "compare" || view === "solution") loadMatches();
    loadRequests();
  }, [view, loadMatches, loadRequests]);

  const sortedRows = useMemo(() => {
    if (!matches?.matches) return [];
    const rows = matches.matches.filter(isShownMatch);
    if (sort === "match") {
      rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    } else if (sort === "country") {
      rows.sort((a, b) => (a.providerCountry ?? "").localeCompare(b.providerCountry ?? ""));
    } else {
      rows.sort((a, b) => a.status.localeCompare(b.status));
    }
    return rows;
  }, [matches, sort]);

  const selectedMatch = sortedRows.find((m) => m.provider === providerId);

  useEffect(() => {
    if (selectedMatch?.institutionLegalName) setInstitution(selectedMatch.institutionLegalName);
    if (selectedMatch && !recipient) {
      setRecipient("introductions@provider.review.example");
    }
  }, [selectedMatch?.institutionLegalName, selectedMatch, recipient]);

  const existingForProvider = (pid: string) =>
    requests.find((r) => r.providerId === pid && !["cancelled", "rejected"].includes(r.status));

  const requiresPayment = requests.length >= 3;

  async function approveSharingAndRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !providerId) return;
    if (!introTerms) {
      setError("Confirm the sharing authorisation first.");
      return;
    }
    const res = await fetch(`/api/applications/${id}/sharing-approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId,
        institutionLegalName: institution,
        recipientEmail: recipient,
        purpose: "Selected institution introduction",
        privacyNoticeVersion: "1.0",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSharingDone(true);
    setError("");
    await requestIntro();
  }

  async function requestIntro() {
    if (!id || !providerId) return;
    if (!introTerms) {
      setError("Confirm the introduction terms first.");
      return;
    }
    const res = await fetch(`/api/applications/${id}/introduction-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, acceptedQuote: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    const intro = data.introduction;
    loadRequests();
    if (intro.paymentStatus === "required" || intro.status === "awaiting_payment") {
      router.push(`/applicant/results?id=${id}&view=checkout&intro=${intro.id}`);
    } else {
      router.push(`/applicant/results?id=${id}&view=introductions`);
    }
  }

  async function simulatePayment(outcome: "success" | "failed") {
    if (!introId) return;
    setMessage(
      outcome === "success"
        ? "Sample payment successful. SOPHIMA must complete applicable checks before an introduction proceeds."
        : "Sample payment failed."
    );
    router.push(`/applicant/results?id=${id}&view=introductions`);
  }

  const subnav = (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link
        href={id ? `/applicant/results?id=${id}` : "/applicant/results"}
        className={`btn text-sm ${view === "results" || view === "compare" || view === "solution" ? "btn-primary" : ""}`}
      >
        Your solutions
      </Link>
      <Link
        href={id ? `/applicant/results?id=${id}&view=introductions` : "/applicant/results?view=introductions"}
        className={`btn text-sm ${view === "introductions" ? "btn-primary" : ""}`}
      >
        My introductions
      </Link>
    </div>
  );

  if (view === "introductions") {
    const pending = requests.filter((r) => !["cancelled", "declined", "rejected"].includes(r.status)).length;
    const used = requests.filter((r) =>
      ["released", "sent", "positive_response", "institution_reviewing"].includes(r.status)
    ).length;
    const remaining = Math.max(0, 3 - used - pending);
    const detailId = params.get("request");
    const detail = detailId ? requests.find((r) => r.id === detailId) : null;

    if (detail) {
      const optionIdx = sortedRows.findIndex((m) => m.provider === detail.providerId);
      const optionLabel =
        optionIdx >= 0 ? providerOptionLabel(optionIdx) : `Provider option`;
      return (
        <>
          <p className="eyebrow">Results & introductions</p>
          {subnav}
          <h1>Introduction request</h1>
          <p className="lead">Track sharing and release status for this introduction.</p>
          <section className="panel">
            <dl>
              <dt>Introduction reference</dt>
              <dd>INT-{detail.id.slice(0, 8).toUpperCase()}</dd>
              <dt>Requested service</dt>
              <dd>Private banking assessment</dd>
              <dt>Provider</dt>
              <dd>{optionLabel}</dd>
              <dt>Status</dt>
              <dd>{introStatusLabel(detail.status)}</dd>
              <dt>Fee / allowance</dt>
              <dd>
                {detail.paymentStatus === "not_required" || detail.paymentStatus === "included"
                  ? "Included in your introduction allowance"
                  : `Payment: ${detail.paymentStatus}`}
              </dd>
            </dl>
          </section>
          <section className="panel">
            <h2>Information sharing</h2>
            <dl>
              <dt>Institution</dt>
              <dd>Revealed after authorised disclosure for this request</dd>
              <dt>Sharing status</dt>
              <dd>
                {detail.status === "released" || detail.status === "sent"
                  ? "Shared"
                  : detail.status === "requested"
                    ? "Approved — not yet shared"
                    : "Awaiting approval"}
              </dd>
            </dl>
            <p className="hint mt-2">
              Approval applies only to this introduction. Withdrawal before release blocks unsent delivery.
            </p>
            <button type="button" className="link-btn mt-2">
              Preview information to be shared
            </button>
          </section>
          <div className="form-actions flex gap-3">
            <Link href={`/applicant/results?id=${id}&view=introductions`} className="btn">
              Back to My introductions
            </Link>
            {["awaiting_payment", "requested"].includes(detail.status) && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (
                    confirm(
                      "Cancel this request? Any reserved introduction will be released according to the allowance rules. Payment refunds follow the agreed payment rules."
                    )
                  ) {
                    setMessage("Cancellation recorded for this prototype. Contact SOPHIMA if a reservation remains open.");
                    setRequests((prev) =>
                      prev.map((r) => (r.id === detail.id ? { ...r, status: "cancelled" } : r))
                    );
                  }
                }}
              >
                Cancel request
              </button>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        <p className="eyebrow">Results & introductions</p>
        {subnav}
        <h1>My introductions</h1>
        <p className="lead">Track your introduction requests and the institution&apos;s response.</p>
        <section className="panel">
          <p>
            Included introductions remaining: {remaining} · Pending requests: {pending} · Introductions used: {used}
          </p>
          <p className="hint">
            A pending request reserves an introduction. It counts as used when the institution gives a positive
            response allowing onboarding to proceed. This is not final account approval.
          </p>
        </section>
        {!requests.length ? (
          <section className="panel">
            <p className="empty">No introductions requested yet. Review your potential providers to get started.</p>
            <Link href={id ? `/applicant/results?id=${id}` : "/applicant/assessments"} className="btn btn-primary mt-3">
              View potential providers
            </Link>
          </section>
        ) : (
          requests.map((r) => (
            <section key={r.id} className="listitem panel">
              <h3>INT-{r.id.slice(0, 8).toUpperCase()}</h3>
              <p>{introStatusLabel(r.status)}</p>
              <p className="hint">
                {r.paymentStatus === "not_required" || r.paymentStatus === "included"
                  ? "Included in your introduction allowance"
                  : `Payment: ${r.paymentStatus}`}
              </p>
              <div className="row-actions flex gap-2 mt-2">
                <Link
                  href={`/applicant/results?id=${id}&view=introductions&request=${r.id}`}
                  className="btn"
                >
                  View request
                </Link>
                {r.status === "awaiting_payment" && (
                  <Link href={`/applicant/results?id=${id}&view=checkout&intro=${r.id}`} className="btn btn-primary">
                    Open checkout
                  </Link>
                )}
                {["awaiting_payment", "requested"].includes(r.status) && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (
                        confirm(
                          "Cancel this request? Any reserved introduction will be released according to the allowance rules."
                        )
                      ) {
                        setRequests((prev) =>
                          prev.map((x) => (x.id === r.id ? { ...x, status: "cancelled" } : x))
                        );
                      }
                    }}
                  >
                    Cancel request
                  </button>
                )}
              </div>
            </section>
          ))
        )}
      </>
    );
  }

  if (view === "checkout" && introId) {
    const fee = fmtFee(true);
    return (
      <>
        <p className="eyebrow">Results & introductions</p>
        {subnav}
        <h1>Review your introduction payment</h1>
        <p className="lead">No live gateway is connected. Use the sample payment controls below.</p>
        <ClientJourneySteps current={3} />
        <section className="panel">
          <div className="summaryline flex justify-between">
            <span>Introduction fee</span>
            <strong>{fee}</strong>
          </div>
          <div className="summaryline flex justify-between">
            <span>Total payable</span>
            <strong>{fee}</strong>
          </div>
          <p className="hint">
            Payment does not guarantee account approval. SOPHIMA must complete the applicable checks before an
            introduction proceeds.
          </p>
          <div className="payment-method panel mt-4">
            <b>Secure payment</b>
            <p>Card payment · sample checkout</p>
            <span className="pill">Demo card ending 4242</span>
            <small>No real card details are requested or stored.</small>
          </div>
          <div className="form-actions flex gap-3 mt-4">
            <button type="button" className="btn btn-primary" onClick={() => simulatePayment("success")}>
              Simulate payment — {fee}
            </button>
            <button type="button" className="btn" onClick={() => simulatePayment("failed")}>
              Simulate failed
            </button>
            <Link href={`/applicant/results?id=${id}&view=introductions`} className="btn">
              My introductions
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (view === "compare") {
    const rows = sortedRows.filter((m) => compare.includes(m.provider));
    return (
      <>
        <p className="eyebrow">Results & introductions</p>
        {subnav}
        <h1>Compare your selected solutions</h1>
        <p className="lead">Compare services, requirements and conditions before choosing a provider.</p>
        {rows.length < 2 ? (
          <section className="panel">
            <p>Select at least two solutions to compare.</p>
            <Link href={`/applicant/results?id=${id}`} className="btn btn-primary mt-3">
              Back to all results
            </Link>
          </section>
        ) : (
          <div className="cards compare-cards">
            {rows.map((r, idx) => (
              <section key={r.provider} className="card panel">
                <h2>{providerOptionLabel(idx)}</h2>
                <dl>
                  <dt>Eligibility</dt>
                  <dd>{statusHeadline(r)}</dd>
                  <dt>SOPHIMA AI match</dt>
                  <dd>{scoreLabel(r.score)}</dd>
                  <dt>Jurisdiction</dt>
                  <dd>{r.providerCountry || "—"}</dd>
                  <dt>Introduction fee</dt>
                  <dd>{existingForProvider(r.provider) ? "Already requested" : fmtFee(requiresPayment)}</dd>
                  {r.reason && (
                    <>
                      <dt>Conditions</dt>
                      <dd>{r.reason}</dd>
                    </>
                  )}
                </dl>
                <Link
                  href={`/applicant/results?id=${id}&view=solution&provider=${encodeURIComponent(r.provider)}`}
                  className="btn btn-primary"
                >
                  View solution
                </Link>
              </section>
            ))}
          </div>
        )}
        <div className="form-actions mt-4">
          <Link href={`/applicant/results?id=${id}`} className="btn">
            Back to all results
          </Link>
        </div>
      </>
    );
  }

  if (view === "solution" && providerId && selectedMatch) {
    const existing = existingForProvider(providerId);
    return (
      <>
        <p className="eyebrow">Results & introductions</p>
        {subnav}
        <h1>Review this provider option</h1>
        <p className="lead">Review eligibility, sharing and introduction terms before requesting an introduction.</p>
        <ClientJourneySteps current={2} />
        {error && <div className="notice notice-error">{error}</div>}
        {message && <div className="notice">{message}</div>}
        <section className="panel">
          <div className="grid">
            <div>
              <h2>{statusHeadline(selectedMatch)}</h2>
              <p>
                {selectedMatch.providerCountry} · Match: {scoreLabel(selectedMatch.score)}
              </p>
              {selectedMatch.reason && <p className="hint">{selectedMatch.reason}</p>}
            </div>
            <div>
              <h2>Introduction fee</h2>
              <strong>{existing ? "Already requested" : fmtFee(requiresPayment)}</strong>
              <p className="hint">{selectedMatch.reason}</p>
            </div>
          </div>
          <p className="hint">
            An introduction is used when the provider gives a genuine positive response allowing onboarding to proceed.
            If you then choose not to proceed, it remains used. A response is not final account approval.
          </p>
        </section>

        {!existing && (
          <section className="panel">
            <h2>Sharing approval</h2>
            <p className="lead">
              <button
                type="button"
                className="link-btn"
                onClick={() =>
                  setMessage(
                    "Preview: external client profile and listed attachments for this revision (SOPHIMA internal due-diligence notes are excluded)."
                  )
                }
              >
                Preview the information to be shared
              </button>
            </p>
            <form onSubmit={approveSharingAndRequest}>
              <label className="field">
                <span>Institution legal name</span>
                <input value={institution} readOnly required />
              </label>
              <label className="field">
                <span>Verified institution recipient</span>
                <input type="email" value={recipient} readOnly required />
              </label>
              <label className="checkline">
                <input type="checkbox" checked={introTerms} onChange={(e) => setIntroTerms(e.target.checked)} />
                <span>
                  I authorise SOPHIMA to share the client profile and listed attachments shown above with{" "}
                  {institution || "the institution"} through the displayed authorised recipient, for this introduction.
                </span>
              </label>
              <button type="submit" className="btn btn-primary" disabled={sharingDone || !introTerms}>
                Approve sharing & request introduction
              </button>
            </form>
            {requiresPayment && (
              <p className="hint mt-2">If payment is required, you will continue to checkout after approval.</p>
            )}
          </section>
        )}

        {existing && (
          <section className="panel">
            <Link href={`/applicant/results?id=${id}&view=introductions`} className="btn btn-primary">
              View my introduction
            </Link>
          </section>
        )}
      </>
    );
  }

  return (
    <>
      <p className="eyebrow">Results & introductions</p>
      {subnav}
      <h1>Your potential providers</h1>
      <p className="lead">
        Compare qualifying options, then review a solution. Matching does not guarantee account approval.
      </p>
      {error && <div className="notice notice-error">{error}</div>}
      {!id && <div className="notice">Select an assessment from My assessments to view matches.</div>}
      {matches && sortedRows.length === 0 && (
        <section className="panel">
          <p>We could not identify a suitable provider based on your current requirements.</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link
              href={id ? `/applicant/questionnaire?applicationId=${id}` : "/applicant/questionnaire"}
              className="btn btn-primary"
            >
              Review my requirements
            </Link>
            <Link
              href={id ? `/applicant/alerts?applicationId=${encodeURIComponent(id)}` : "/applicant/alerts"}
              className="btn"
            >
              Notify me of future matches
            </Link>
          </div>
        </section>
      )}
      {matches && sortedRows.length > 0 && (
        <>
          <div className="toolbar flex flex-wrap gap-4 items-center mb-4">
            <span>{sortedRows.length} qualifying provider options</span>
            <label className="field mb-0">
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                {(sortedRows.some((r) => r.score != null)
                  ? SORTS
                  : SORTS.filter(([v]) => v !== "match")
                ).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="notice">
            {matches.eligibleCount} complete potential fit · {matches.conditionalCount} needs clarification
            {matches.partialCount ? ` · ${matches.partialCount} partial coverage` : ""}
          </div>
          <div className="cards">
            {sortedRows.map((m, idx) => {
              const existing = existingForProvider(m.provider);
              const label = providerOptionLabel(idx);
              return (
                <article key={m.provider} className="card panel">
                  <div className="card-head flex justify-between">
                    <div>
                      <h2>{label}</h2>
                      <span className="pill">{statusHeadline(m)}</span>
                    </div>
                    <div className="fit text-right">
                      {scoreLabel(m.score)}
                      <div style={{ fontSize: 11, fontWeight: 400 }}>SOPHIMA AI match</div>
                    </div>
                  </div>
                  <dl>
                    <dt>Jurisdiction</dt>
                    <dd>{m.providerCountry || "—"}</dd>
                    <dt>Introduction fee</dt>
                    <dd>{existing ? "Already requested" : fmtFee(requiresPayment)}</dd>
                  </dl>
                  {existing ? (
                    <Link href={`/applicant/results?id=${id}&view=introductions`} className="btn btn-primary">
                      View my introduction
                    </Link>
                  ) : (
                    <Link
                      href={`/applicant/results?id=${id}&view=solution&provider=${encodeURIComponent(m.provider)}`}
                      className="btn btn-primary"
                    >
                      View solution
                    </Link>
                  )}
                  <label className="checkline compare-choice mt-2">
                    <input
                      type="checkbox"
                      checked={compare.includes(m.provider)}
                      onChange={(e) => {
                        setCompare((prev) =>
                          e.target.checked ? [...prev, m.provider] : prev.filter((x) => x !== m.provider)
                        );
                      }}
                    />
                    Compare this solution
                  </label>
                </article>
              );
            })}
          </div>
          <div className="form-actions flex flex-wrap gap-3 items-center mt-4">
            <Link
              href={`/applicant/results?id=${id}&view=compare`}
              className={`btn ${compare.length < 2 ? "opacity-50 pointer-events-none" : "btn-primary"}`}
            >
              Compare selected ({compare.length})
            </Link>
            <span className="hint">Select two or three solutions to compare.</span>
          </div>
          <p className="disclaimer text-sm text-[var(--muted)] mt-4">
            Potential fit is not account approval. Provider names remain confidential until sharing is approved.
          </p>
        </>
      )}
    </>
  );
}
