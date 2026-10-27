import Link from "next/link";
import { LegalChrome } from "@/components/LegalChrome";

export default function TermsOfUsePage() {
  return (
    <LegalChrome>
      <main className="page-shell" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }}>
        <p className="eyebrow">Legal</p>
        <h1>Terms of use</h1>
        <p className="lead">
          SOPHIMA AI facilitates matching and introductions between applicants and financial institutions.
          Potential fit is not account approval or financial advice.
        </p>
        <section className="panel">
          <p>
            Use of this platform is subject to the applicable agreements for your role (applicant, provider or
            introducer) and to the{" "}
            <Link href="/legal/privacy">Privacy notice</Link> and{" "}
            <Link href="/legal/retention">retention policy</Link>.
          </p>
          <p className="mt-3">
            Questions:{" "}
            <a href="mailto:introductions@sophima.ai">introductions@sophima.ai</a>
          </p>
        </section>
      </main>
    </LegalChrome>
  );
}
