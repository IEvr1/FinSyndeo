import { AdminFunctionPage } from "@/components/AdminFunctionPage";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

export default function AdminRatingsPage() {
  return (
    <AdminFunctionPage
      eyebrow="External ratings"
      title="External rating administration"
      lead="Verify the exact institution and permitted source. Applicants see only an approved band."
    >
      <div className="notice">
        External rating persistence is not wired to the database yet. Approved rating bands cannot be recorded through
        this environment until storage and publication rules are implemented.
      </div>
      <AdminEmptyState
        title="No rating records"
        description="When rating administration is connected, verified institution bands will appear here for review before applicant display."
      />
    </AdminFunctionPage>
  );
}
