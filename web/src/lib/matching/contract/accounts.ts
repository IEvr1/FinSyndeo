import type { PredicateOutcome } from "./types";
import { LEGAL_STRUCTURES } from "./types";

/**
 * Account and legal-structure scoping (M05 / R11 / R12 / T28–T32 / T36–T37 / T45).
 * Never infer client-funds from operating, safeguarding from segregation,
 * White Label from BaaS, card issuing from acquiring, or Trust from corporate.
 */

export type AccountCapability = {
  operating?: boolean;
  clientFunds?: boolean;
  segregation?: boolean;
  safeguarding?: boolean;
  baas?: boolean;
  whiteLabel?: boolean;
  acquiring?: boolean;
  cardIssuing?: boolean;
};

export function evaluateAccountRequest(
  requested: "operating" | "clientFunds" | "both",
  supported: AccountCapability
): PredicateOutcome {
  const hasOp = supported.operating === true;
  const hasClient = supported.clientFunds === true;

  if (requested === "operating") return hasOp ? "Pass" : "Fail";
  if (requested === "clientFunds") return hasClient ? "Pass" : "Fail";
  // both — AND (T30)
  if (hasOp && hasClient) return "Pass";
  return "Fail";
}

export function evaluateSafeguarding(supported: AccountCapability): PredicateOutcome {
  // Segregation does not imply safeguarding (T28)
  return supported.safeguarding === true ? "Pass" : "Fail";
}

export function evaluateServiceInference(
  requested: "baas" | "whiteLabel" | "acquiring" | "cardIssuing",
  supported: AccountCapability
): PredicateOutcome {
  return supported[requested] === true ? "Pass" : "Fail";
}

export type RouteScope = keyof typeof LEGAL_STRUCTURES;

export function isLegalStructureAllowed(
  route: RouteScope,
  structure: string
): PredicateOutcome {
  const allowed = LEGAL_STRUCTURES[route] as readonly string[];
  const normalized = structure.trim();
  if (allowed.some((a) => a.toLowerCase() === normalized.toLowerCase())) {
    return "Pass";
  }
  return "Fail";
}

/** Corporate support does not establish Trust support (T45). */
export function evaluateEntitySupport(
  requested: string,
  supportedEntities: string[]
): PredicateOutcome {
  return supportedEntities.includes(requested) ? "Pass" : "Fail";
}

/**
 * Group brand is not automatically one legal provider (M03 / R23 / T46).
 * Distinct offering entities need explicit approved arrangement.
 */
export function evaluateOfferingEntity(params: {
  groupBrand: string;
  requestedEntity: string;
  approvedEntities: string[];
}): PredicateOutcome {
  if (params.approvedEntities.includes(params.requestedEntity)) return "Pass";
  // Matching brand alone is insufficient
  if (params.groupBrand && params.requestedEntity.startsWith(params.groupBrand)) {
    return "Fail";
  }
  return "Fail";
}
