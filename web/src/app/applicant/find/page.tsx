import Link from "next/link";

export default function FindProviderPage() {
  return (
    <>
      <p className="eyebrow">Find a provider</p>
      <h1>Tell us about your needs</h1>
      <p className="lead">Choose how you would like to share them.</p>
      <div className="tiles">
        <section className="tile">
          <h2>Questionnaire</h2>
          <p>Bank, merchant, both, financing, private banking or correspondent accounts.</p>
          <Link href="/applicant/questionnaire" className="btn btn-primary">
            Start questionnaire
          </Link>
        </section>
        <section className="tile">
          <h2>Guided intake</h2>
          <p>Spoken prompts and typed answers. Voice when configured.</p>
          <Link href="/applicant/guided" className="btn btn-primary">
            Start conversation
          </Link>
        </section>
      </div>
    </>
  );
}
