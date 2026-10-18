"use client";

import { Suspense } from "react";
import { QuestionnaireWizard } from "@/components/QuestionnaireWizard";

export default function GuidedIntakePage() {
  return (
    <Suspense fallback={<p>Loading assessment…</p>}>
      <QuestionnaireWizard showPageHeader guidedMode />
    </Suspense>
  );
}
