/**
 * Proofing Alignment and Matching Register — common matching contract (M01–M12).
 * Deterministic comparison operators used by T01–T51 reference checks.
 */

export * from "./types";
export * from "./capability";
export * from "./intervals";
export * from "./accounts";
export * from "./merchant-math";
export * from "./financing";
export * from "./settlement";
export * from "./priorities";
export * from "./fit";

import type { CoverageStatus, PredicateOutcome } from "./types";

/** Map legacy engine yes/no/unknown/review to contract outcomes. */
export function legacyStatusToOutcome(
  status: string
): PredicateOutcome {
  switch (status) {
    case "yes":
      return "Pass";
    case "no":
      return "Fail";
    case "unknown":
    case "review":
      return "Unresolved";
    case "na":
    case "n/a":
    case "inactive":
      return "Not applicable";
    default:
      return "Unresolved";
  }
}

/** Map legacy eligible/conditional/unsupported to coverage (M03). */
export function legacyMatchToCoverage(status: string): CoverageStatus {
  switch (status) {
    case "eligible":
      return "Complete potential fit";
    case "conditional":
      return "Needs clarification";
    case "unsupported":
      return "Not supported";
    default:
      return "Needs clarification";
  }
}

export const CONTRACT_VERSION = "matching-contract-m01-m12-2026-10-20";
