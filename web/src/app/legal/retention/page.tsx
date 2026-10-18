import Link from "next/link";

export default function RetentionPolicyPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <p className="eyebrow">Legal</p>
      <h1>Retention policy</h1>
      <p className="lead">
        Outline of how long FinSyndeo keeps assessment, introduction and account records.
      </p>
      <section className="panel">
        <p>
          Active assessments and introduction records are retained while your account remains open and for a
          limited period afterwards to support audits, dispute handling and regulatory obligations. Information
          already disclosed to an institution may continue to be held independently by that institution under
          its own policies.
        </p>
        <p className="mt-3">
          Closing your sign-in stops future access and match alerts but does not by itself delete every
          retained record. A separate deletion request is reviewed against this policy. See the{" "}
          <Link href="/legal/privacy">Privacy Notice</Link> for how to exercise your rights.
        </p>
      </section>
    </main>
  );
}
