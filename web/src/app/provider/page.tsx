"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardStatus = {
  legalName?: string;
  status?: string;
  pendingReview?: boolean;
  hasPublishedProfile?: boolean;
  agreementSigned?: boolean;
};

export default function ProviderDashboard() {
  const [info, setInfo] = useState<DashboardStatus>({ status: "Draft" });

  useEffect(() => {
    fetch("/api/providers/profile/draft")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setInfo(d);
      })
      .catch(() => undefined);
  }, []);

  const status = info.status ?? "Draft";
  const statusCta =
    status === "Changes required" ? (
      <Link href="/provider/profile">View requested changes</Link>
    ) : status === "Draft" ? (
      <Link href="/provider/profile">Continue your profile</Link>
    ) : null;

  return (
    <>
      <p className="eyebrow">Financial institutions</p>
      <h1>Your Provider Dashboard</h1>
      <p className="lead">Manage your institution profile and referred cases.</p>
      {info.legalName && <p className="hint">{info.legalName}</p>}
      <p className="hint">
        <strong>Profile status:</strong> {status}
        {statusCta ? (
          <>
            {" — "}
            {statusCta}
          </>
        ) : null}
      </p>
      {info.pendingReview && info.hasPublishedProfile && (
        <div className="notice">
          Your changes are awaiting SOPHIMA review. Your previously approved profile remains active.
        </div>
      )}
      {info.pendingReview && !info.hasPublishedProfile && (
        <div className="notice">
          Matching begins only after SOPHIMA approval and verification of a current referral agreement.
        </div>
      )}
      <div className="tiles">
        <section className="tile">
          <h2>Institution Profile</h2>
          <p>Maintain your institution details, services and eligibility criteria.</p>
          <Link href="/provider/profile" className="btn btn-primary">
            Manage Profile
          </Link>
        </section>
        <section className="tile">
          <h2>Referred Cases &amp; Reports</h2>
          <p>Review authorised case information and institution reports.</p>
          <Link href="/provider/reports" className="btn btn-primary">
            View Cases &amp; Reports
          </Link>
        </section>
        <section className="tile">
          <h2>Reporting Preferences</h2>
          <p>Manage report delivery and approved recipients.</p>
          <Link href="/provider/preferences" className="btn btn-primary">
            Manage Preferences
          </Link>
        </section>
      </div>
      <p className="text-sm text-[var(--muted)] mt-6">
        Profile updates follow the existing review and publication process.
      </p>
    </>
  );
}
