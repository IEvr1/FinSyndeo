import { AdminFunctionPage } from "@/components/AdminFunctionPage";


export default function AdminPage() {
  return (
    <AdminFunctionPage eyebrow="Country policy" title="Country acceptance" lead="Two-group policy. Group 1 excludes platform countries; Group 2 retains full UBO catalogue.">
      <div className="notice">The Russia/Iran review sample is not loaded as production policy. Publish counsel-approved exclusions before release.</div>
    </AdminFunctionPage>
  );
}
