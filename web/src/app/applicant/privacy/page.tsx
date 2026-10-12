export default function ApplicantPrivacyPage() {
  return (
    <>
      <p className="eyebrow">Account & data</p>
      <h1>Account & data</h1>
      <p className="lead">Request access, correction or deletion. Account closure and erasure are separate events.</p>
      <section className="panel flex flex-wrap gap-3">
        <button type="button" className="btn">
          Download my information
        </button>
        <button type="button" className="btn">
          Turn off future-provider alerts
        </button>
        <button type="button" className="btn">
          Withdraw selected application
        </button>
        <button type="button" className="btn btn-primary">
          Request account and data deletion
        </button>
      </section>
      <p className="text-sm text-[var(--muted)]">
        Processing follows the approved privacy notice and rights-handling process.
      </p>
    </>
  );
}
