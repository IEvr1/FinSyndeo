"use client";

import { useState } from "react";

export default function SharingPage() {
  const [applicationId, setApplicationId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [institution, setInstitution] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");

  async function approve(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/applications/${applicationId}/sharing-approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId,
        institutionLegalName: institution,
        recipientEmail: recipient,
        purpose: "Introduction to financial institution",
        privacyNoticeVersion: "1.0",
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Sharing approval recorded for this revision." : data.error);
  }

  return (
    <>
      <p className="eyebrow">Sharing permissions</p>
      <h1>Approve an institution introduction</h1>
      <p className="lead">
        Check the named institution and recipient before sharing the current client profile.
      </p>
      <form className="panel" onSubmit={approve}>
        <label className="field">
          <span>Application ID</span>
          <input value={applicationId} onChange={(e) => setApplicationId(e.target.value)} required />
        </label>
        <label className="field">
          <span>Selected institution (provider ID)</span>
          <input value={providerId} onChange={(e) => setProviderId(e.target.value)} required />
        </label>
        <label className="field">
          <span>Institution legal name</span>
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} required />
        </label>
        <label className="field">
          <span>Verified institution recipient</span>
          <input type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary">
          Confirm sharing for this introduction
        </button>
      </form>
      {message && <div className="notice">{message}</div>}
    </>
  );
}
