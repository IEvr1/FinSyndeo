"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatAssessmentRoute } from "@/lib/questionnaire/private-banking-config";

type App = {
  id: string;
  route: string;
  status: string;
  updatedAt: string;
  introducerName?: string | null;
};

export default function AssessmentsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [message, setMessage] = useState("");

  function reload() {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => setApps(d.applications ?? []));
  }

  useEffect(() => {
    reload();
  }, []);

  function withdraw(app: App) {
    if (
      !confirm(
        "Withdraw this assessment? Pending introductions and sharing for this assessment may be affected. This does not delete your profile or other assessments."
      )
    ) {
      return;
    }
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "withdrawn" } : a)));
    setMessage(
      `Assessment ${app.id.slice(0, 8)} marked withdrawn in this session. SOPHIMA will apply the effect to pending introductions and sharing under the agreed rules.`
    );
  }

  return (
    <>
      <p className="eyebrow">My assessments</p>
      <h1>My assessments</h1>
      <p className="lead">Resume, edit or review saved applications.</p>
      {message && <div className="notice">{message}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Route</th>
              <th>Status</th>
              <th>Attribution</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={5}>No assessments yet.</td>
              </tr>
            ) : (
              apps.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.id.slice(0, 8)}… · {new Date(a.updatedAt).toLocaleDateString()}
                  </td>
                  <td>{formatAssessmentRoute(a.route)}</td>
                  <td>{a.status}</td>
                  <td>{a.introducerName ?? "Direct"}</td>
                  <td>
                    <Link href={`/applicant/results?id=${a.id}`} className="btn text-sm py-1 px-2">
                      View results
                    </Link>
                    <Link
                      href={`/applicant/questionnaire?applicationId=${a.id}`}
                      className="btn text-sm py-1 px-2 ml-2"
                    >
                      Edit assessment
                    </Link>
                    <Link
                      href={`/applicant/alerts?applicationId=${a.id}`}
                      className="btn text-sm py-1 px-2 ml-2"
                    >
                      Notifications
                    </Link>
                    {a.status !== "withdrawn" && (
                      <button type="button" className="btn text-sm py-1 px-2 ml-2" onClick={() => withdraw(a)}>
                        Withdraw selected application
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
