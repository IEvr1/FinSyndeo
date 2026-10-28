import Link from "next/link";
import { IntroducerDashboard } from "@/components/introducer/IntroducerDashboard";

export default function IntroducerHomePage() {
  return (
    <>
      <p className="eyebrow">Introducer workspace</p>
      <h1>Your referrals and commissions</h1>
      <p className="lead">Manage your referrals and view your own commercial records.</p>
      <IntroducerDashboard />
      <h2 className="mt-8 mb-3 text-lg">Documents and payments</h2>
      <div className="tiles">
        <section className="tile">
          <h2>My documents</h2>
          <p>Agreements and supporting documents</p>
          <Link href="/introducer/documents" className="btn btn-primary">
            My documents
          </Link>
        </section>
        <section className="tile">
          <h2>Invoices &amp; payments</h2>
          <p>Invoices and payment records</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link href="/introducer/payments" className="btn btn-primary">
              Invoices &amp; payments
            </Link>
            <Link href="/introducer/invoice" className="btn">
              Upload invoice
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
