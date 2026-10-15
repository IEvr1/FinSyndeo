import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="flex justify-between items-center px-6 py-8 max-w-[1120px] mx-auto w-full">
        <Image src="/assets/FinSyndeo-logo.png" alt="FinSyndeo" width={220} height={58} priority />
        <nav className="flex gap-5 text-sm items-center">
          <Link href="/auth/sign-in">Sign in</Link>
        </nav>
      </header>
      <main className="max-w-[1060px] mx-auto px-6 pb-16 pt-4">
        <h1 className="text-center max-w-[720px] mx-auto">Find the right financial institution for your needs</h1>
        <p className="lead text-center mx-auto">
          Register as an applicant or provider institution. Introducer and SOPHIMA Admin access is invitation-only.
        </p>
        <div className="tiles mt-10">
          <section className="tile text-center">
            <h2>Applicant</h2>
            <p>Assess your needs, compare providers, and request introductions.</p>
            <Link href="/auth/sign-up?role=applicant" className="btn btn-primary">
              Register as applicant
            </Link>
          </section>
          <section className="tile text-center">
            <h2>Provider institution</h2>
            <p>Manage your profile, acceptance criteria, and referred cases.</p>
            <Link href="/auth/sign-up?role=provider" className="btn btn-primary">
              Register as provider
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
