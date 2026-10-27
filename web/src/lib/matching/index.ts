/* eslint-disable @typescript-eslint/no-require-imports */
// Port of prototype matching-engine.js — behavioural reference from guidelines
// eslint-disable-next-line @typescript-eslint/no-var-requires
const criteria = require("./legacy/criterion-catalog.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require("./legacy/matching-engine.js");

import {
  CONTRACT_VERSION,
  legacyMatchToCoverage,
  type CoverageStatus,
} from "./contract";
import { coverageForMatch } from "./le-bank-coverage";

export type MatchResult = {
  matches: Array<{
    provider: string;
    essential: boolean;
    conditional: boolean;
    status: string;
    /** M03 coverage status — separate from readiness and score */
    coverageStatus: CoverageStatus;
    score: number | null;
    coverage: number;
    reason: string;
    /** LE22 — which requested accounts are / are not covered when coverage is partial */
    coverageNote?: string;
    missing?: string[];
  }>;
  eligibleCount: number;
  conditionalCount: number;
  /** Provider options with Partial coverage (LE22) */
  partialCount?: number;
  contractVersion: string;
  error?: string;
};

export function evaluateMatches(
  typedSnapshot: Record<string, unknown>,
  providers: Array<Record<string, unknown>>,
  profiles: Record<string, Record<string, unknown>>,
  options?: { now?: string }
): MatchResult {
  const raw = engine.evaluate(typedSnapshot, providers, profiles, options ?? {});
  const matches = (raw.matches || []).map(
    (m: {
      provider: string;
      essential: boolean;
      conditional: boolean;
      status: string;
      score: number | null;
      coverage: number;
      reason: string;
      missing?: string[];
    }) => {
      // LE22: Partial coverage vs Complete potential fit for Legal Entity bank requests.
      const { coverageStatus, coverageNote } = coverageForMatch(m, typedSnapshot);
      return {
        ...m,
        coverageStatus: coverageStatus ?? legacyMatchToCoverage(m.status),
        ...(coverageNote ? { coverageNote, reason: coverageNote } : {}),
      };
    }
  );
  return {
    ...raw,
    matches,
    partialCount: matches.filter((m: { coverageStatus: CoverageStatus }) => m.coverageStatus === "Partial coverage").length,
    contractVersion: CONTRACT_VERSION,
  };
}

export function fixtureProfile(provider: Record<string, unknown>) {
  return engine.fixtureProfile(provider);
}

export { criteria };
export * from "./contract";
