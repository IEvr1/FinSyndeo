"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResultsContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const [matches, setMatches] = useState<{ matches: unknown[]; eligibleCount: number; conditionalCount: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/applications/${id}/matches`, { method: "POST" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setMatches(d);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <>
      <p className="eyebrow">Results</p>
      <h1>Results & introductions</h1>
      <p className="lead">Eligible and conditional matches are shown separately. Fit is not a probability of approval.</p>
      {error && <div className="notice notice-error">{error}</div>}
      {matches && (
        <>
          <div className="notice">
            {matches.eligibleCount} eligible · {matches.conditionalCount} conditional
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Fit</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {(matches.matches as Array<Record<string, unknown>>).map((m, i) => (
                  <tr key={i}>
                    <td>{String(m.provider)}</td>
                    <td>{String(m.status)}</td>
                    <td>{m.score == null ? "Not scored" : `${m.score}%`}</td>
                    <td>{String(m.coverage ?? 0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}
