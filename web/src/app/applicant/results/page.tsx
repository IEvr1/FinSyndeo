"use client";

import { Suspense } from "react";
import { ResultsFlow } from "@/components/applicant/ResultsFlow";

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsFlow />
    </Suspense>
  );
}
