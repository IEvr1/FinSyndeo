"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type App = { id: string; route: string; status: string; updatedAt: string };

export default function AssessmentsPage() {
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => setApps(d.applications ?? []));
  }, []);

  return (
    <>
      <p className="eyebrow">My assessments</p>
      <h1>My assessments</h1>
      <p className="lead">Resume, edit or review saved applications.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Route</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={4}>No assessments yet.</td>
              </tr>
            ) : (
              apps.map((a) => (
                <tr key={a.id}>
                  <td>{a.id.slice(0, 8)}…</td>
                  <td>{a.route}</td>
                  <td>{a.status}</td>
                  <td>
                    <Link href={`/applicant/results?id=${a.id}`} className="btn text-sm py-1 px-2">
                      View results
                    </Link>
                    <Link href={`/applicant/questionnaire?applicationId=${a.id}`} className="btn text-sm py-1 px-2 ml-2">
                      Edit assessment
                    </Link>
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
