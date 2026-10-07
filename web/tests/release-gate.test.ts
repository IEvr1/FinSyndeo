import { describe, it, expect } from "vitest";
import { evaluateReleaseGate } from "@/lib/release-gate";

describe("release gate", () => {
  it("blocks without sharing approval", () => {
    const result = evaluateReleaseGate({
      hasCurrentRevision: true,
      sharingApprovalValid: false,
      sharingRevisionMatches: false,
      screeningRuns: [],
      requiresPayment: false,
      paymentVerified: false,
      ddReportSeparate: true,
      profileAttachedNotDd: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.holds.some((h) => h.includes("sharing"))).toBe(true);
  });

  it("blocks when screening unavailable", () => {
    const result = evaluateReleaseGate({
      hasCurrentRevision: true,
      sharingApprovalValid: true,
      sharingRevisionMatches: true,
      screeningRuns: [
        {
          subjectId: "applicant",
          scope: "sanctions",
          status: "unavailable",
          sourceVersions: {},
          message: "Required screening source stale or unavailable.",
        },
      ],
      requiresPayment: false,
      paymentVerified: false,
      ddReportSeparate: true,
      profileAttachedNotDd: true,
    });
    expect(result.allowed).toBe(false);
  });
});
