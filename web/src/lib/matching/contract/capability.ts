import type { CapabilityStatus, PredicateOutcome, PredicateResult } from "./types";

/** Map provider capability status to a predicate outcome (M01 / M03). */
export function capabilityToOutcome(status: CapabilityStatus): PredicateOutcome {
  switch (status) {
    case "Supported":
      return "Pass";
    case "Not supported":
      return "Fail";
    case "Conditional":
    case "Not confirmed":
      return "Unresolved";
    default:
      return "Unresolved";
  }
}

/**
 * Evaluate essential capability predicates (T01–T05).
 * A known Fail is never rescued by other Unresolved essentials.
 */
export function evaluateEssentialCapabilities(
  requested: Array<{ key: string; status: CapabilityStatus }>
): { overall: PredicateOutcome; predicates: PredicateResult[] } {
  const predicates: PredicateResult[] = requested.map((r) => ({
    key: r.key,
    outcome: capabilityToOutcome(r.status),
    reason: `Capability ${r.key}: ${r.status}`,
    priority: "essential",
  }));

  if (predicates.some((p) => p.outcome === "Fail")) {
    return { overall: "Fail", predicates };
  }
  if (predicates.some((p) => p.outcome === "Unresolved")) {
    return { overall: "Unresolved", predicates };
  }
  if (predicates.length === 0) {
    return { overall: "Pass", predicates };
  }
  return { overall: "Pass", predicates };
}

/**
 * Bank rails use ALL essentials (M06 / R08 / T06–T07).
 * No rails selected → no rail predicate (T11).
 */
export function evaluateBankRailsAll(
  requested: string[],
  supported: Record<string, CapabilityStatus>
): { overall: PredicateOutcome; predicates: PredicateResult[] } {
  if (!requested.length) {
    return {
      overall: "Pass",
      predicates: [
        {
          key: "rails.none",
          outcome: "Not applicable",
          reason: "No selected bank rail creates no rail-specific requirement.",
        },
      ],
    };
  }
  return evaluateEssentialCapabilities(
    requested.map((rail) => ({
      key: `rail.${rail}`,
      status: supported[rail] ?? "Not confirmed",
    }))
  );
}

/**
 * Settlement receiving alternatives use ANY compatible rail (M07 / R08 / T08–T10).
 * Intersection of acquirer payout rails and destination receiving rails.
 */
export function evaluateSettlementAny(
  payoutRails: string[],
  receiving: Record<string, CapabilityStatus>
): PredicateOutcome {
  if (!payoutRails.length) return "Unresolved";

  let anyUnresolved = false;
  for (const rail of payoutRails) {
    const status = receiving[rail] ?? "Not confirmed";
    if (status === "Supported") return "Pass";
    if (status === "Not confirmed" || status === "Conditional") anyUnresolved = true;
  }
  return anyUnresolved ? "Unresolved" : "Fail";
}

/** Exact rail identity — SEPA ≠ SEPA Instant; ACH ≠ Fedwire (T12–T13). */
export function railsEquivalent(a: string, b: string): boolean {
  return normalizeRail(a) === normalizeRail(b);
}

export function normalizeRail(rail: string): string {
  return rail.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Crypto asset + network must both match (T26).
 * On-ramp does not imply off-ramp (T27).
 */
export function evaluateCryptoExact(params: {
  requestedAsset: string;
  requestedNetwork: string;
  supportedAsset: string;
  supportedNetwork: string;
}): PredicateOutcome {
  if (
    params.requestedAsset === params.supportedAsset &&
    params.requestedNetwork === params.supportedNetwork
  ) {
    return "Pass";
  }
  return "Fail";
}

export function evaluateDistinctServices(params: {
  requested: string;
  supported: string[];
}): PredicateOutcome {
  return params.supported.includes(params.requested) ? "Pass" : "Fail";
}
