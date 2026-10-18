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
      <p className="eyebrow">Provider workspace</p>
      <h1>Your provider dashboard</h1>
      <p className="lead">Manage your institution&apos;s profile, referrals and reporting.</p>
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
          <h2>Institution profile</h2>
          <p>Update services, acceptance policies and product terms.</p>
          <Link href="/provider/profile" className="btn btn-primary">
            Manage profile
          </Link>
        </section>
        <section className="tile">
          <h2>Reporting preferences</h2>
          <p>Choose scheduled reports and request an ad hoc report.</p>
          <Link href="/provider/preferences" className="btn btn-primary">
            Manage preferences
          </Link>
        </section>
        <section className="tile">
          <h2>Referred cases &amp; reports</h2>
          <p>View your institution&apos;s referred cases and available reports.</p>
          <Link href="/provider/reports" className="btn btn-primary">
            View cases &amp; reports
          </Link>
        </section>
        <section className="tile">
          <h2>Sign-in &amp; data settings</h2>
          <p>Manage sign-in details and data requests.</p>
          <Link href="/provider/privacy" className="btn btn-primary">
            Open settings
          </Link>
        </section>
      </div>
    </>
  );
}
