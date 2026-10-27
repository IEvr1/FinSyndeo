/**
 * Common matching contract (M01–M12) from the Proofing Alignment and Matching Register.
 * Provider capability states and applicant priorities never share one field.
 */

export type PredicateOutcome = "Pass" | "Fail" | "Unresolved" | "Not applicable";

/** Provider capability status (M01). Missing data is Not confirmed, never Supported. */
export type CapabilityStatus =
  | "Supported"
  | "Conditional"
  | "Not supported"
  | "Not confirmed";

/** Applicant importance labels (M04). */
export type ApplicantPriority = "Must-have" | "Good to have";

export type RequiredStage =
  | "assessment_fit"
  | "introduction_readiness"
  | "onboarding"
  | "needs_clarification";

export type CoverageStatus =
  | "Complete potential fit"
  | "Partial coverage"
  | "Needs clarification"
  | "Not supported";

export type ReadinessStatus =
  | "ready"
  | "pending_introduction"
  | "pending_onboarding"
  | "blocked";

export type PredicateResult = {
  key: string;
  outcome: PredicateOutcome;
  reason: string;
  scope?: string;
  evidence?: string;
  stage?: RequiredStage;
  priority?: ApplicantPriority | "essential" | "preference";
};

export type ServiceFitResult = {
  service: string;
  coverage: CoverageStatus;
  readiness: ReadinessStatus;
  predicates: PredicateResult[];
  entityId?: string;
};

export type Interval = {
  /** Inclusive lower bound; null = unbounded below */
  min: number | null;
  minInclusive: boolean;
  /** Inclusive upper bound; null = unbounded above (infinite) */
  max: number | null;
  maxInclusive: boolean;
};

export const COUNT_BANDS: Record<string, Interval> = {
  "1-10": { min: 1, minInclusive: true, max: 10, maxInclusive: true },
  "11-50": { min: 11, minInclusive: true, max: 50, maxInclusive: true },
  "51-100": { min: 51, minInclusive: true, max: 100, maxInclusive: true },
  "over-100": { min: 101, minInclusive: true, max: null, maxInclusive: false },
};

export const AMOUNT_BANDS: Record<string, Interval> = {
  "0-50k": { min: 0, minInclusive: false, max: 50_000, maxInclusive: true },
  "50k-200k": { min: 50_000, minInclusive: false, max: 200_000, maxInclusive: true },
  "200k-500k": { min: 200_000, minInclusive: false, max: 500_000, maxInclusive: true },
  "500k-1m": { min: 500_000, minInclusive: false, max: 1_000_000, maxInclusive: true },
  "over-1m": { min: 1_000_000, minInclusive: false, max: null, maxInclusive: false },
};

/** Main bank / financing / fiat settlement currency pickers (M06 / R10). */
export const MAIN_FIAT_CURRENCIES = ["EUR", "GBP", "USD"] as const;

/** Bank rail catalogue (M06). ABA is not a rail. */
export const BANK_RAILS = {
  EUR: ["SEPA", "SEPA Instant", "SWIFT", "TARGET T2"],
  GBP: ["FPS", "CHAPS", "SWIFT"],
  USD: ["ACH", "Fedwire", "SWIFT"],
} as const;

export const LEGAL_STRUCTURES = {
  bank: [
    "Private limited company",
    "Public company",
    "Partnership",
    "LLP",
    "Foundation",
    "Association",
    "Trust",
    "Other",
  ],
  merchant: ["Private limited company", "Association"],
  financing: ["Private limited company", "Partnership", "LLP"],
  correspondent: ["Private limited company"],
} as const;
