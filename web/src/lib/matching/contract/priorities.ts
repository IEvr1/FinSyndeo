import type { ApplicantPriority, PredicateOutcome } from "./types";

/**
 * Uniform priorities (M04 / R04 / R05 / T50).
 * Must-have and Good to have are the only visible labels.
 * Nice to have / Preferred map to preference only where confirmed.
 * Missing preferred capabilities do not become essential predicates.
 */

export function mapLegacyPriority(
  label: string
): ApplicantPriority | "preference" | null {
  const n = label.trim().toLowerCase();
  if (n === "must-have" || n === "required" || n === "essential") return "Must-have";
  if (n === "good to have" || n === "preferred" || n === "nice to have") return "Good to have";
  return null;
}

export function isEssentialPriority(priority: string | undefined): boolean {
  if (!priority) return true; // merchant processing methods are required by default (M04)
  const mapped = mapLegacyPriority(priority);
  return mapped === "Must-have";
}

/**
 * Preferred / Good-to-have gap is absent from essential predicates (T50).
 * Returns Pass when evaluating essential set that ignores preference-only gaps.
 */
export function evaluateEssentialIgnoringPreferences(params: {
  essentials: Array<{ key: string; outcome: PredicateOutcome }>;
  preferenceGaps: string[];
}): PredicateOutcome {
  void params.preferenceGaps; // intentionally unused — preferences never fail essentials
  if (params.essentials.some((e) => e.outcome === "Fail")) return "Fail";
  if (params.essentials.some((e) => e.outcome === "Unresolved")) return "Unresolved";
  return "Pass";
}

/**
 * At least one currency is required, but none need be Must-have (M04 / R05).
 * Underlying account remains essential even when all currency prefs are Good to have.
 */
export function currencyPriorityConstraint(
  currencies: Array<{ code: string; priority: ApplicantPriority }>
): {
  hasCurrency: boolean;
  hasEssentialCurrency: boolean;
  accountEssentialWithoutCurrencyConstraint: boolean;
} {
  const hasCurrency = currencies.length > 0;
  const hasEssentialCurrency = currencies.some((c) => c.priority === "Must-have");
  return {
    hasCurrency,
    hasEssentialCurrency,
    accountEssentialWithoutCurrencyConstraint: hasCurrency && !hasEssentialCurrency,
  };
}

/** Gateway Must keep is essential; Good to have is preference (M04). */
export function gatewayRetentionPriority(
  retention: "Must keep" | "Good to have" | "No preference" | "Not applicable"
): "essential" | "preference" | "inactive" {
  if (retention === "Must keep") return "essential";
  if (retention === "Good to have") return "preference";
  return "inactive";
}
