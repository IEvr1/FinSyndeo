import type { CapabilityStatus, PredicateOutcome } from "./types";
import { capabilityToOutcome } from "./capability";

/**
 * Fiat vs crypto settlement alternatives (M07 / T43–T44).
 * Either acceptable → OR; Both required → AND.
 */

export type SettlementType = "fiat" | "crypto";

export function evaluateSettlementTypes(params: {
  mode: "either" | "both";
  fiat: CapabilityStatus;
  crypto: CapabilityStatus;
}): PredicateOutcome {
  const fiat = capabilityToOutcome(params.fiat);
  const crypto = capabilityToOutcome(params.crypto);

  if (params.mode === "either") {
    if (fiat === "Pass" || crypto === "Pass") return "Pass";
    if (fiat === "Fail" && crypto === "Fail") return "Fail";
    return "Unresolved";
  }

  // both — AND
  if (fiat === "Fail" || crypto === "Fail") return "Fail";
  if (fiat === "Unresolved" || crypto === "Unresolved") return "Unresolved";
  return "Pass";
}

/** Authorisation / condition not confirmed remains Unresolved (T47). */
export function evaluateAuthorisation(status: CapabilityStatus): PredicateOutcome {
  return capabilityToOutcome(status);
}
