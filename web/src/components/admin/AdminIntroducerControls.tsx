"use client";

import { useState } from "react";

export function AdminIntroducerControls({
  introducerId,
  initialStatus,
  initialLinkSuspended,
}: {
  introducerId: string;
  initialStatus: string;
  initialLinkSuspended: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [linkSuspended, setLinkSuspended] = useState(initialLinkSuspended);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const res = await fetch(`/api/admin/introducers/${introducerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, linkSuspended }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Update failed.");
      return;
    }
    setMessage("Introducer updated.");
  }

  async function publishAgreements() {
    setMessage("");
    const res = await fetch(`/api/admin/introducers/${introducerId}/agreements`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Publish failed.");
      return;
    }
    setMessage(`Published ${data.agreements?.length ?? 0} agreement documents.`);
  }

  return (
    <div className="panel my-4">
      <h3 className="text-base font-semibold mb-2">Manage introducer</h3>
      <label className="field">
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="invited">invited</option>
          <option value="active">active</option>
          <option value="suspended">suspended</option>
          <option value="terminated">terminated</option>
        </select>
      </label>
      <label className="flex items-center gap-2 my-2">
        <input type="checkbox" checked={linkSuspended} onChange={(e) => setLinkSuspended(e.target.checked)} />
        Suspend referral link only
      </label>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={save}>
          Save access
        </button>
        <button type="button" className="btn" onClick={publishAgreements}>
          Publish agreements
        </button>
      </div>
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}
