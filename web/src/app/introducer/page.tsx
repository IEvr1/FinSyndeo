import Link from "next/link";

export default function IntroducerDashboard() {
  return (
    <>
      <p className="eyebrow">Introducer workspace</p>
      <h1>Introducer dashboard</h1>
      <div className="tiles">
        <section className="tile">
          <h2>My referrals</h2>
          <Link href="/introducer/referrals" className="btn btn-primary">Open</Link>
        </section>
        <section className="tile">
          <h2>Commission ledger</h2>
          <Link href="/introducer/ledger" className="btn btn-primary">Open</Link>
        </section>
      </div>
      <p className="notice">Referral tokens identify attribution — they are not login credentials.</p>
    </>
  );
}
