import Link from "next/link";

export default function ProviderDashboard() {
  return (
    <>
      <p className="eyebrow">Provider workspace</p>
      <h1>Your provider dashboard</h1>
      <p className="lead">Manage your institution&apos;s profile, referrals and reporting.</p>
      <p className="hint">
        <strong>Profile status:</strong> Draft — <Link href="/provider/profile">Continue your profile</Link>
      </p>
      <div className="tiles">
        <section className="tile">
          <h2>Institution profile</h2>
          <p>Update services, acceptance policies and product terms.</p>
          <Link href="/provider/profile" className="btn btn-primary">
            Manage profile
          </Link>
        </section>
        <section className="tile">
          <h2>Reporting preferences</h2>
          <p>Choose scheduled reports and request an ad hoc report.</p>
          <Link href="/provider/preferences" className="btn btn-primary">
            Manage preferences
          </Link>
        </section>
        <section className="tile">
          <h2>Referred cases &amp; reports</h2>
          <p>View your institution&apos;s referred cases and available reports.</p>
          <Link href="/provider/reports" className="btn btn-primary">
            View cases &amp; reports
          </Link>
        </section>
        <section className="tile">
          <h2>Sign-in &amp; data settings</h2>
          <p>Manage sign-in details and data requests.</p>
          <Link href="/provider/privacy" className="btn btn-primary">
            Open settings
          </Link>
        </section>
      </div>
    </>
  );
}
