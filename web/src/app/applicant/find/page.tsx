import Link from "next/link";

export default function FindProviderPage() {
  return (
    <>
      <p className="eyebrow">Find a provider</p>
      <h1>Tell us about your needs</h1>
      <p className="lead">Complete your assessment yourself or with AI guidance.</p>
      <div className="tiles">
        <section className="tile">
          <h2>Complete a questionnaire</h2>
          <p>Answer a short series of questions at your own pace.</p>
          <Link href="/applicant/questionnaire" className="btn btn-primary">
            Start questionnaire
          </Link>
        </section>
        <section className="tile">
          <h2>AI-guided assessment</h2>
          <p>Get help one question at a time with typed guidance.</p>
          <Link href="/applicant/guided" className="btn btn-primary">
            Start with AI guidance
          </Link>
        </section>
      </div>
    </>
  );
}
