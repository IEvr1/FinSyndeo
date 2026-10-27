import type { PredicateOutcome } from "./types";

/**
 * Financing comparisons (M10 / R17 / T33–T35).
 * Maritime uses maritime_vessel_finance; Shipping finance is an alias.
 * Shipping industry / equipment / project finance does not confirm vessel lending.
 */

const MARITIME_KEYS = new Set([
  "maritime_vessel_finance",
  "shipping_finance", // alias
]);

export function normalizeFinancePurpose(purpose: string): string {
  const n = purpose.trim().toLowerCase().replace(/\s+/g, "_");
  if (n === "shipping_finance" || n === "shipping-finance") return "maritime_vessel_finance";
  return n;
}

export function evaluateMaritimePurpose(
  requested: string,
  supportedPurposes: string[]
): PredicateOutcome {
  const req = normalizeFinancePurpose(requested);
  const supported = new Set(supportedPurposes.map(normalizeFinancePurpose));
  if (MARITIME_KEYS.has(req) || req === "maritime_vessel_finance") {
    return supported.has("maritime_vessel_finance") ? "Pass" : "Fail";
  }
  return supported.has(req) ? "Pass" : "Fail";
}

/**
 * Compare available audited years as a set (T34–T35).
 * Nonconsecutive years cannot satisfy a consecutive-history rule.
 */
export function evaluateAuditedYears(params: {
  availableYears: number[];
  requiredConsecutive?: number;
  requiredYears?: number[];
}): PredicateOutcome {
  const available = [...new Set(params.availableYears)].sort((a, b) => a - b);

  if (params.requiredYears?.length) {
    const set = new Set(available);
    return params.requiredYears.every((y) => set.has(y)) ? "Pass" : "Fail";
  }

  const n = params.requiredConsecutive ?? 0;
  if (n <= 0) return "Pass";
  if (available.length < n) return "Fail";

  // Find any consecutive run of length n
  let run = 1;
  for (let i = 1; i < available.length; i++) {
    if (available[i] === available[i - 1] + 1) {
      run += 1;
      if (run >= n) return "Pass";
    } else {
      run = 1;
    }
  }
  return run >= n ? "Pass" : "Fail";
}
