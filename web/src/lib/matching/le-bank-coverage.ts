import { legacyMatchToCoverage } from "./contract/index";
import type { CoverageStatus } from "./contract/types";

/**
 * LE22 — Legal Entity bank requests: supporting some requested accounts but not all is
 * "Partial coverage", never a complete fit (and not "Not supported" when something is covered).
 * Applies only to the LE bank journey (typed data carries requirements.bank.leVersion).
 */

type Evaluation = { key: string; status: string; level?: string };

type MatchLike = {
  status: string;
  evaluations?: Evaluation[];
  reason?: string;
};

const ACCOUNT_LABELS: Record<string, string> = {
  "capability.operating": "operating account",
  "capability.client_funds": "dedicated client-funds account",
};

export function isLegalEntityBankSnapshot(snapshot: Record<string, unknown>): boolean {
  const bank = (snapshot?.requirements as { bank?: { leVersion?: string } } | undefined)?.bank;
  return snapshot?.route === "bank" && typeof bank?.leVersion === "string";
}

export function coverageForMatch(
  match: MatchLike,
  snapshot: Record<string, unknown>
): { coverageStatus: CoverageStatus; coverageNote?: string } {
  const base = legacyMatchToCoverage(match.status);
  if (!isLegalEntityBankSnapshot(snapshot) || match.status !== "unsupported") {
    return { coverageStatus: base };
  }
  const evaluations = match.evaluations ?? [];
  const essential = evaluations.filter((e) => (e.level ?? "essential") === "essential");
  const capabilities = essential.filter((e) => e.key.startsWith("capability."));
  const covered = capabilities.filter((e) => e.status === "yes");
  const missing = capabilities.filter((e) => e.status === "no");
  const otherFailures = essential.filter((e) => !e.key.startsWith("capability.") && e.status === "no");

  if (covered.length > 0 && missing.length > 0 && otherFailures.length === 0) {
    const label = (key: string) => ACCOUNT_LABELS[key] ?? key.replace("capability.", "").replace(/_/g, " ");
    return {
      coverageStatus: "Partial coverage",
      coverageNote: `Supports the ${covered.map((e) => label(e.key)).join(", ")}; does not support the ${missing
        .map((e) => label(e.key))
        .join(", ")}.`,
    };
  }
  return { coverageStatus: base };
}
