import { Suspense } from "react";
import { AlertsContent } from "./AlertsContent";

export default function AlertsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading notification settings…</p>}>
      <AlertsContent />
    </Suspense>
  );
}
