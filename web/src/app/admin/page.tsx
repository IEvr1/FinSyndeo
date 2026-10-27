import Link from "next/link";
import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { UnresolvedList } from "@/components/UnresolvedList";

export default function AdminPage() {
  return (
    <AdminFunctionPage
      eyebrow="Restricted administration"
      title="SOPHIMA AI Administration"
      lead="One environment for platform operations and commercial administration."
    >
      <div className="tiles">
        <section className="tile">
          <h2>Applicants and providers</h2>
          <p>Manage assessments, institution profiles and published policies.</p>
          <Link href="/admin/cases" className="btn btn-primary">
            Open operations
          </Link>
        </section>
        <section className="tile">
          <h2>Introducers and commissions</h2>
          <p>Manage authorised arrangements, allocations and reconciliation.</p>
          <Link href="/admin/intro-overview" className="btn btn-primary">
            Open commercial records
          </Link>
        </section>
        <section className="tile">
          <h2>Introductions and reporting</h2>
          <p>Introduction requests and release controls</p>
          <Link href="/admin/entitlements" className="btn btn-primary">
            Existing approval workflow
          </Link>
        </section>
        <section className="tile">
          <h2>Payments, reports and audit history</h2>
          <p>Permission-controlled access</p>
          <Link href="/admin/audit" className="btn btn-primary">
            Open audit history
          </Link>
        </section>
      </div>
      <p className="text-sm text-[var(--muted)] mt-4 mb-6">
        Existing role permissions, commercial confidentiality and audit controls remain in place.
      </p>
      <UnresolvedList filter="open" />
    </AdminFunctionPage>
  );
}
