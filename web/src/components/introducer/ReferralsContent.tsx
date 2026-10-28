"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ReferralRow = {
  applicationId: string;
  clientName: string;
  route: string;
  status: string;
  onBehalf: boolean;
  applicantConfirmed: boolean;
  updatedAt: string;
};

type Me = { referralUrl: string; linkActive: boolean };

export function ReferralsContent() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [message, setMessage] = useState("");

  function reload() {
    fetch("/api/introducers/me/referrals")
      .then((r) => r.json())
      .then((d) => setReferrals(d.referrals ?? []));
    fetch("/api/introducers/me")
      .then((r) => r.json())
      .then((d) =>
        setMe(
          d.introducer
            ? { referralUrl: d.introducer.referralUrl, linkActive: d.introducer.linkActive }
            : null
        )
      );
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <>
      {me && (
        <section className="panel mb-4">
          <h2>Client referral link</h2>
          <p className="text-sm text-[var(--muted)]">
            Share this link so applicants complete their own assessment.{" "}
            {me.linkActive ? "Link is active." : "Link is not active yet."}
          </p>
          <code className="block text-sm break-all">{me.referralUrl}</code>
        </section>
      )}

      <section className="panel mb-4">
        <h2>Submit on behalf of a client</h2>
        <p className="text-sm text-[var(--muted)]">
          Start the applicant questionnaire from your introducer session, then submit with authority confirmation.
        </p>
        <Link href="/applicant/find" className="btn btn-primary">
          Start on-behalf assessment
        </Link>
        <p className="hint mt-2">
          After saving the assessment, use the on-behalf API from your integrator workflow or contact SOPHIMA Admin
          for assisted submission during rollout.
        </p>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <h2>Attributed referrals</h2>
        {referrals.length === 0 ? (
          <p>No referrals yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>On behalf</th>
                  <th>Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.applicationId}>
                    <td>{r.clientName}</td>
                    <td>{r.route}</td>
                    <td>{r.status}</td>
                    <td>{r.onBehalf ? "Yes" : "No"}</td>
                    <td>{r.applicantConfirmed ? "Yes" : "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
