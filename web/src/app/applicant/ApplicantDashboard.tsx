"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      <p className="eyebrow">Applicant workspace</p>
      <h1>Your FinSyndeo dashboard</h1>
      <p className="lead">Find suitable providers and manage your applications.</p>

      {draft && (
        <section className="panel dashboard-continue">
          <h2>Continue your assessment</h2>
          <p>
            {draft.route} · Last saved {savedLabel}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link href={`/applicant/questionnaire?applicationId=${draft.id}`} className="btn btn-primary">
              Continue your assessment
            </Link>
            <Link href="/applicant/find" className="btn">
              Start a new assessment
            </Link>
          </div>
        </section>
      )}

      <div className="tiles">
        <section className="tile">
          <h2>Find a provider</h2>
          <p>Tell us what you need.</p>
          <Link href="/applicant/find" className="btn btn-primary">
            Start an assessment
          </Link>
        </section>
        <section className="tile">
          <h2>My assessments</h2>
          <p>Continue or update your saved assessments.</p>
          <Link href="/applicant/assessments" className="btn btn-primary">
            View my assessments
          </Link>
        </section>
        <section className="tile">
          <h2>Results &amp; introductions</h2>
          <p>Review potential matches and track introductions.</p>
          <Link href="/applicant/results" className="btn btn-primary">
            View results
          </Link>
        </section>
        <section className="tile">
          <h2>Match notifications</h2>
          <p>Choose whether to hear about new providers matching your needs.</p>
          <Link href="/applicant/alerts" className="btn btn-primary">
            Manage notifications
          </Link>
        </section>
      </div>
    </>
  );
}
