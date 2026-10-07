import Link from "next/link";

export default function ApplicantDashboard() {
  return (
    <>
      <p className="eyebrow">Applicant workspace</p>
      <h1>Your FinSyndeo dashboard</h1>
      <p className="lead">Assessments, potential providers and introductions in one place.</p>
      <div className="tiles">
        <section className="tile">
          <h2>Find a Provider</h2>
          <p>One adaptive questionnaire for your needs.</p>
          <Link href="/applicant/find" className="btn btn-primary">
            Open
          </Link>
        </section>
        <section className="tile">
          <h2>Your assessments</h2>
          <p>Resume, edit or review saved applications.</p>
          <Link href="/applicant/assessments" className="btn btn-primary">
            Open
          </Link>
        </section>
      </div>
    </>
  );
}
