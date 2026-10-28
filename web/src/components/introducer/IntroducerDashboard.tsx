"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type IntroducerMe = {
  displayName: string;
  referralUrl: string;
  linkActive: boolean;
  status: string;
  linkSuspended: boolean;
};

export function IntroducerDashboard() {
  const [data, setData] = useState<IntroducerMe | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/introducers/me")
      .then((r) => r.json())
      .then((d) => setData(d.introducer ?? null));
  }, []);

  async function copyLink() {
    if (!data?.referralUrl) return;
    await navigator.clipboard.writeText(data.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {data && (
        <section className="panel mb-4">
          <h2>Your referral link</h2>
          <p className="text-sm text-[var(--muted)]">
            Attribution only — not a login credential.{" "}
            <span className={data.linkActive ? "text-green-700" : "text-amber-700"}>
              {data.linkActive ? "Active" : "Inactive"}
            </span>
            {data.linkSuspended ? " (link suspended)" : null}
          </p>
          <code className="block text-sm break-all my-2">{data.referralUrl}</code>
          <button type="button" className="btn btn-primary" onClick={copyLink}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </section>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel">
          <h2>Referrals</h2>
          <p>Use your referral link or complete an assessment for an authorised client.</p>
          <Link href="/introducer/referrals" className="btn btn-primary">
            View referral options
          </Link>
        </section>
        <section className="panel">
          <h2>Commissions</h2>
          <p>Posted entries and invoicing under your agreement.</p>
          <Link href="/introducer/ledger" className="btn btn-primary">
            My commissions
          </Link>
        </section>
      </div>
    </>
  );
}
