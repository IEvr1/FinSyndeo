"use client";

import { useState } from "react";

export function ApplicantReferralConfirm({ applicationId }: { applicationId: string }) {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function confirm() {
    setMessage("");
    const res = await fetch(`/api/referrals/${applicationId}/applicant-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Confirmation failed.");
      return;
    }
    setDone(true);
    setMessage("Request confirmed. You may continue with matching and introductions.");
  }

  if (done) return <p className="text-sm text-green-700">{message}</p>;

  return (
    <div className="notice my-2">
      <p className="text-sm">An introducer submitted this assessment on your behalf. Confirm to proceed.</p>
      <button type="button" className="btn btn-primary text-sm mt-2" onClick={confirm}>
        Confirm request
      </button>
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}
