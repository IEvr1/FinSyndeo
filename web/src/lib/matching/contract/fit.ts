import type {
  CoverageStatus,
  PredicateOutcome,
  PredicateResult,
  ReadinessStatus,
  RequiredStage,
  ServiceFitResult,
} from "./types";

/**
 * Complete / partial / conditional / unsupported outcomes (M02 / M03 / T48–T51).
 * Coverage status and readiness status are separate fields.
 */

export function aggregateEssentialOutcome(
  predicates: PredicateResult[]
): PredicateOutcome {
  const active = predicates.filter((p) => p.outcome !== "Not applicable");
  if (active.some((p) => p.outcome === "Fail")) return "Fail";
  if (active.some((p) => p.outcome === "Unresolved")) return "Unresolved";
  return "Pass";
}

export function serviceCoverageFromEssentials(
  overall: PredicateOutcome
): CoverageStatus {
  switch (overall) {
    case "Pass":
      return "Complete potential fit";
    case "Fail":
      return "Not supported";
    case "Unresolved":
      return "Needs clarification";
    default:
      return "Needs clarification";
  }
}

/**
 * Multi-service request: only complete support for every component → complete overall fit (T48–T49).
 * Supported alongside missing → Partial coverage; none supported → Not supported (not Partial).
 */
export function overallMultiServiceFit(
  services: Array<{ id: string; outcome: PredicateOutcome }>
): CoverageStatus {
  if (!services.length) return "Needs clarification";

  const passes = services.filter((s) => s.outcome === "Pass").length;
  const fails = services.filter((s) => s.outcome === "Fail").length;
  const unresolved = services.filter((s) => s.outcome === "Unresolved").length;

  if (passes === services.length) return "Complete potential fit";
  if (fails === services.length) return "Not supported";
  if (passes === 0 && unresolved > 0 && fails === 0) return "Needs clarification";
  if (passes === 0) return "Not supported";
  if (fails > 0 || unresolved > 0) return "Partial coverage";
  return "Needs clarification";
}

/**
 * Complete-fit predicate for multi-service (T48–T49).
 * One failed component fails complete fit even when Partial coverage is shown.
 */
export function evaluateCompleteMultiServiceFit(
  services: Array<{ id: string; outcome: PredicateOutcome }>
): PredicateOutcome {
  if (!services.length) return "Unresolved";
  if (services.every((s) => s.outcome === "Pass")) return "Pass";
  if (services.some((s) => s.outcome === "Fail")) return "Fail";
  return "Unresolved";
}

export function readinessForService(params: {
  coverage: CoverageStatus;
  deferredOnboarding: boolean;
  pendingIntroduction: boolean;
}): ReadinessStatus {
  if (params.coverage === "Not supported") return "blocked";
  if (params.pendingIntroduction) return "pending_introduction";
  if (params.deferredOnboarding) return "pending_onboarding";
  if (params.coverage === "Complete potential fit") return "ready";
  return "pending_introduction";
}

/**
 * Unclassified condition defaults to Needs clarification (M02).
 * Deferred onboarding conditions stay pending and are not fulfilled.
 */
export function stageForCondition(
  stage: RequiredStage | undefined
): RequiredStage {
  return stage ?? "needs_clarification";
}

/**
 * Inactive / unselected client schedule is absent from essential predicates (T51).
 */
export function activePredicatesOnly(
  predicates: PredicateResult[],
  activeKeys: Set<string>
): PredicateResult[] {
  return predicates
    .filter((p) => activeKeys.has(p.key))
    .concat(
      predicates
        .filter((p) => !activeKeys.has(p.key))
        .map((p) => ({
          ...p,
          outcome: "Not applicable" as const,
          reason: `${p.reason} (inactive / unselected)`,
        }))
    );
}

export function buildServiceFit(
  service: string,
  predicates: PredicateResult[],
  opts?: { entityId?: string; deferredOnboarding?: boolean }
): ServiceFitResult {
  const overall = aggregateEssentialOutcome(predicates);
  const coverage = serviceCoverageFromEssentials(overall);
  return {
    service,
    coverage,
    readiness: readinessForService({
      coverage,
      deferredOnboarding: opts?.deferredOnboarding ?? false,
      pendingIntroduction: coverage !== "Complete potential fit",
    }),
    predicates,
    entityId: opts?.entityId,
  };
}

/** Eligibility precedes ranking; score never offsets essential failure (M12). */
export function sortByEligibilityThenScore<
  T extends { coverage: CoverageStatus; score: number | null; id: string },
>(items: T[]): T[] {
  const rank = (c: CoverageStatus) => {
    switch (c) {
      case "Complete potential fit":
        return 0;
      case "Needs clarification":
        return 1;
      case "Partial coverage":
        return 2;
      case "Not supported":
        return 3;
      default:
        return 4;
    }
  };
  return [...items].sort(
    (a, b) =>
      rank(a.coverage) - rank(b.coverage) ||
      (b.score ?? -1) - (a.score ?? -1) ||
      a.id.localeCompare(b.id)
  );
}
