import Link from "next/link";

export default function ProviderDashboard() {
  return (
    <>
      <p className="eyebrow">Provider workspace</p>
      <h1>Your institution workspace</h1>
      <p className="lead">Manage facilities, acceptance criteria and reports.</p>
      <div className="tiles">
        <section className="tile">
          <h2>Your profile</h2>
          <p>Services, industries, countries, authorisations and internal documents.</p>
          <Link href="/provider/profile" className="btn btn-primary">
            Open
          </Link>
        </section>
        <section className="tile">
          <h2>Reporting preferences</h2>
          <p>Automatic reporting periods and ad hoc reports.</p>
          <Link href="/provider/preferences" className="btn btn-primary">
            Open
          </Link>
        </section>
        <section className="tile">
          <h2>Case reports</h2>
          <p>Only your authorised provider relationships.</p>
          <Link href="/provider/reports" className="btn btn-primary">
            Open
          </Link>
        </section>
      </div>
      <p className="notice">
        Updated criteria require SOPHIMA review before publication. The last approved version remains active during
        review.
      </p>
    </>
  );
}
