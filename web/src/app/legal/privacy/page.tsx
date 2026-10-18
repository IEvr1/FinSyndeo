import Link from "next/link";

export default function PrivacyNoticePage() {
  return (
    <main className="page-shell" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <p className="eyebrow">Legal</p>
      <h1>Privacy Notice</h1>
      <p className="lead">
        How SOPHIMA / FinSyndeo uses personal information for assessments, matching, screening, sharing,
        retention and your data rights.
      </p>

      <section className="panel">
        <h2>Assessment</h2>
        <p>
          When you complete an assessment we process the information you provide so we can understand your
          requirements, save your progress to your signed-in account, and prepare an anonymised client profile.
        </p>
      </section>

      <section className="panel">
        <h2>Matching</h2>
        <p>
          We compare your confirmed requirements with provider acceptance criteria to identify potential
          solutions. A potential match does not guarantee account approval by any institution.
        </p>
      </section>

      <section className="panel">
        <h2>Screening</h2>
        <p>
          We apply platform screening and risk checks before any introduction. Restricted jurisdictions or
          unsupported combinations may prevent a match or introduction.
        </p>
      </section>

      <section className="panel">
        <h2>Sharing</h2>
        <p>
          We do not share your client profile with an institution merely because you found a match. Sharing
          requires a separate, recipient-specific approval for a named introduction. You can preview what would
          be shared before approving.
        </p>
      </section>

      <section className="panel">
        <h2>Retention</h2>
        <p>
          We retain assessment, introduction and audit records for as long as needed for the service and
          applicable legal obligations. Closing your sign-in and deleting personal data are separate actions;
          some information may need to be retained under the{" "}
          <Link href="/legal/retention">retention policy</Link>.
        </p>
      </section>

      <section className="panel">
        <h2>Your rights</h2>
        <p>
          You may request access, correction or deletion of your personal data, and you may withdraw sharing
          approval before information is released. Use{" "}
          <Link href="/applicant/privacy">Sign-in &amp; data settings</Link> while signed in, or contact
          SOPHIMA through the channels published on our website.
        </p>
      </section>

      <p className="text-sm text-[var(--muted)]">
        Acknowledging this notice on the assessment start page is not blanket consent for all processing.
        Separate optional consents apply for match notifications and any audio capture where those features are
        enabled.
      </p>
    </main>
  );
}
