"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatAssessmentRoute } from "@/lib/questionnaire/private-banking-config";

type App = {
  id: string;
  route: string;
  status: string;
  updatedAt: string;
};

export function ApplicantDashboard() {
  const [draft, setDraft] = useState<App | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        const apps = (d.applications ?? []) as App[];
        const open = apps
          .filter((a) => a.status === "draft")
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        setDraft(open ?? null);
      })
      .catch(() => undefined);
  }, []);

  const savedLabel = draft
    ? new Date(draft.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <>
      <p className="eyebrow">Your workspace</p>
      <h1>Your SOPHIMA AI dashboard</h1>
      <p className="lead">Your profiles, potential matches and introductions in one place.</p>

      <div className="tiles">
        <section className="tile">
          <h2>Find a Provider</h2>
          <p>Complete an assessment yourself or with AI guidance.</p>
          <Link href="/applicant/find" className="btn btn-primary">
            Start an assessment
          </Link>
        </section>
        <section className="tile">
          <h2>My assessments</h2>
          <p>Resume a saved profile or review your requirements.</p>
          <Link href="/applicant/assessments" className="btn btn-primary">
            View assessments
          </Link>
        </section>
      </div>

      {draft && (
        <section className="panel dashboard-continue">
          <h2>Continue your assessment</h2>
          <p>
            {formatAssessmentRoute(draft.route)}
            {savedLabel ? ` · Draft — last saved ${savedLabel}` : " · Draft — Your saved Client Information Profile"}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link href={`/applicant/questionnaire?applicationId=${draft.id}`} className="btn btn-primary">
              Continue
            </Link>
          </div>
        </section>
      )}

      <p className="text-sm text-[var(--muted)] mt-6">
        Potential fit is not account approval. You approve sharing for a specific institution and profile
        revision.
      </p>
    </>
  );
}
