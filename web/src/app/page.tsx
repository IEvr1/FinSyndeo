import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex justify-between items-center px-6 py-5 bg-white border-b border-[var(--line)] w-full">
        <BrandLogo priority />
        <nav className="public-header-nav">
          <Link href="/auth/sign-in">Sign in</Link>
          <Link href="/auth/sign-up" className="btn">
            Register
          </Link>
        </nav>
      </header>
      <main className="max-w-[920px] mx-auto px-6 pb-16 pt-14 flex flex-col items-center flex-1 w-full">
        <p className="eyebrow text-center">Matching and introductions</p>
        <h1 className="text-center max-w-[640px] w-full mx-auto text-[var(--ink)]">
          Connecting clients with financial institutions
        </h1>
        <p className="lead text-center max-w-[560px] mt-3">
          Tell us what you need. Explore potential matches. Request an introduction when you are ready.
        </p>
        <div id="register" className="tiles mt-12 w-full">
          <section className="tile">
            <h2>Looking for a financial provider?</h2>
            <p>Complete your profile and explore institutions that may meet your requirements.</p>
            <Link href="/auth/sign-up?role=applicant" className="btn btn-primary mt-4">
              Register as Applicant
            </Link>
          </section>
          <section className="tile">
            <h2>Represent a financial institution?</h2>
            <p>Manage your institution profile, services and eligibility criteria.</p>
            <Link href="/auth/sign-up?role=provider" className="btn btn-primary mt-4">
              Register as Provider
            </Link>
          </section>
        </div>
        <div className="landing-steps">
          <div className="landing-step">
            <span className="landing-step-num">01</span>
            <h2>Complete your profile</h2>
            <p>Use the questionnaire or AI guidance.</p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">02</span>
            <h2>Explore potential matches</h2>
            <p>Review providers against your needs.</p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">03</span>
            <h2>Request an introduction</h2>
            <p>Approve sharing with your selected institution.</p>
          </div>
        </div>
        <p className="text-sm text-[var(--muted)] text-center mt-12 max-w-[640px]">
          SOPHIMA AI facilitates matching and introductions. Potential fit is not account approval or
          financial advice.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
