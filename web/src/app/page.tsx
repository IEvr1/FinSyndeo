import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="flex justify-between items-center px-6 py-5 bg-white border-b border-[var(--line)] w-full">
        <Image
          src="/assets/FinSyndeo-logo.png"
          alt="FinSyndeo by SOPHIMA"
          width={200}
          height={53}
          priority
        />
        <nav className="flex gap-5 text-sm items-center">
          <Link href="/auth/sign-in">Sign in</Link>
          <Link href="/auth/sign-up">Register</Link>
        </nav>
      </header>
      <main className="max-w-[920px] mx-auto px-6 pb-20 pt-16">
        <h1 className="text-center max-w-[640px] mx-auto text-[var(--doc-navy)]">
          Connecting clients with financial institutions
        </h1>
        <div className="tiles mt-12">
          <section className="tile flex items-center justify-center min-h-[120px]">
            <Link href="/auth/sign-up?role=applicant" className="btn btn-primary">
              Register as Applicant
            </Link>
          </section>
          <section className="tile flex items-center justify-center min-h-[120px]">
            <Link href="/auth/sign-up?role=provider" className="btn btn-primary">
              Register as Provider
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
