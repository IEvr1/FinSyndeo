import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="flex justify-between items-center px-6 py-5 bg-white border-b border-[var(--line)]">
        <Image src="/assets/FinSyndeo-logo.png" alt="FinSyndeo" width={200} height={54} priority />
        <nav className="flex gap-4 text-sm">
          <Link href="/auth/sign-in">Sign in</Link>
          <Link href="/auth/sign-up">Register</Link>
        </nav>
      </header>
      <main className="max-w-[1060px] mx-auto px-6 py-12">
        <p className="eyebrow">FinSyndeo production</p>
        <h1>Find the right financial institution for your needs</h1>
        <p className="lead">
          Applicants and provider institutions can register. Introducer and SOPHIMA Admin access
          is invitation-only.
        </p>
        <div className="tiles">
          <section className="tile">
            <h2>Applicant</h2>
            <p>Assess your needs, compare providers, and request introductions.</p>
            <Link href="/auth/sign-up?role=applicant" className="btn btn-primary">
              Register as applicant
            </Link>
          </section>
          <section className="tile">
            <h2>Provider institution</h2>
            <p>Manage your profile, acceptance criteria, and case reports.</p>
            <Link href="/auth/sign-up?role=provider" className="btn btn-primary">
              Register as provider
            </Link>
          </section>
        </div>
        <p className="notice mt-8 text-sm">
          Behaviour and screens follow the approved FinSyndeo guidelines prototype. Live screening,
          payments, voice, and email require configured integrations.
        </p>
      </main>
    </div>
  );
}
