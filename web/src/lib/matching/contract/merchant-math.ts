/**
 * Merchant market arithmetic (M09 / R15 / T38–T42).
 * Fixed decimal precision; at most 0.01 percentage-point rounding tolerance.
 */

const SCALE = 100; // store as basis of 0.01 pp → integer hundredths of a percent

function toFixedShare(percent: number): number {
  return Math.round(percent * SCALE);
}

function fromFixedShare(scaled: number): number {
  return scaled / SCALE;
}

/** Market share × method share → overall contribution (T38: 20% × 50% = 10). */
export function marketMethodContribution(
  marketSharePercent: number,
  methodSharePercent: number
): number {
  const overall =
    (toFixedShare(marketSharePercent) * toFixedShare(methodSharePercent)) / (100 * SCALE);
  return fromFixedShare(Math.round(overall));
}

/** Sum market shares; expect 100 (T39). */
export function sumShares(shares: number[]): number {
  const total = shares.reduce((s, x) => s + toFixedShare(x), 0);
  return fromFixedShare(total);
}

export function sharesReconcile(
  shares: number[],
  expected = 100,
  tolerancePp = 0.01
): { ok: boolean; total: number; discrepancy: number } {
  const total = sumShares(shares);
  const discrepancy = Math.abs(total - expected);
  return { ok: discrepancy <= tolerancePp + 1e-9, total, discrepancy };
}

/**
 * Average ticket from comparable value/count when count is positive (T40).
 * Never infer a maximum from this.
 */
export function averageFromValueCount(value: number, count: number): number | null {
  if (!(count > 0) || !Number.isFinite(value) || !Number.isFinite(count)) return null;
  return value / count;
}

/**
 * Named wallet is not inferred from Card (T42).
 * Future method support must be explicit (T41).
 */
export function methodSupported(
  requested: string,
  supported: string[],
  opts?: { inferCardImpliesWallet?: boolean }
): "Pass" | "Fail" {
  if (supported.includes(requested)) return "Pass";
  if (
    opts?.inferCardImpliesWallet &&
    requested.toLowerCase().includes("wallet") &&
    supported.some((s) => /card/i.test(s))
  ) {
    // Explicitly forbidden inference
    return "Fail";
  }
  return "Fail";
}

/** Keep countries and remaining regions disjoint (M09). */
export function remainingRegionCountries(
  regionDefinition: string[],
  namedCountries: string[]
): string[] {
  const named = new Set(namedCountries.map((c) => c.toLowerCase()));
  return regionDefinition.filter((c) => !named.has(c.toLowerCase()));
}
