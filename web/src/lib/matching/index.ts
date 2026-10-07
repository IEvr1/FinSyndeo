/* eslint-disable @typescript-eslint/no-require-imports */
// Port of prototype matching-engine.js — behavioural reference from guidelines
// eslint-disable-next-line @typescript-eslint/no-var-requires
const criteria = require("./legacy/criterion-catalog.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require("./legacy/matching-engine.js");

export type MatchResult = {
  matches: Array<{
    provider: string;
    essential: boolean;
    conditional: boolean;
    status: string;
    score: number | null;
    coverage: number;
    reason: string;
    missing?: string[];
  }>;
  eligibleCount: number;
  conditionalCount: number;
  error?: string;
};

export function evaluateMatches(
  typedSnapshot: Record<string, unknown>,
  providers: Array<Record<string, unknown>>,
  profiles: Record<string, Record<string, unknown>>,
  options?: { now?: string }
): MatchResult {
  return engine.evaluate(typedSnapshot, providers, profiles, options ?? {});
}

export function fixtureProfile(provider: Record<string, unknown>) {
  return engine.fixtureProfile(provider);
}

export { criteria };
