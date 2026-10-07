/** Accounting per ACCOUNTING-SPEC — C01, C02, C03 enforced. */

export const AUTOMATIC_TIERS = [
  { clients: 1, ratePercent: 30 },
  { clients: 2, ratePercent: 40 },
  { clients: 3, ratePercent: 50 },
] as const;

export const SUPPORTED_CURRENCIES = ["EUR", "GBP", "USD", "CHF"] as const;

export type EffectiveTerms = {
  ratePercent: number;
  mode: "automatic" | "bespoke";
  contractVersion: string;
  effectiveAt: string;
  sequence: number;
};

export function resolveAutomaticTier(successfulClientCount: number): number {
  if (successfulClientCount >= 3) return 50;
  if (successfulClientCount === 2) return 40;
  return 30;
}

export function effectiveTermsAtPosting(
  successfulClientCount: number,
  bespokeRate: number | null,
  postedAt: string,
  contractVersion: string,
  sequence: number
): EffectiveTerms {
  if (bespokeRate !== null) {
    return {
      ratePercent: bespokeRate,
      mode: "bespoke",
      contractVersion,
      effectiveAt: postedAt,
      sequence,
    };
  }
  return {
    ratePercent: resolveAutomaticTier(successfulClientCount),
    mode: "automatic",
    contractVersion,
    effectiveAt: postedAt,
    sequence,
  };
}

export function computeShareMinor(netMinor: number, ratePercent: number): number {
  return Math.round((netMinor * ratePercent) / 100);
}

export type ReceiptTaxMode = "vat_included" | "vat_added" | "reverse_charge";

export function computeEligibleNet(params: {
  grossMinor: number;
  vatMinor: number;
  withholdingMinor: number;
  chargesMinor: number;
  mode: ReceiptTaxMode;
}): { expectedCashMinor: number; eligibleNetMinor: number } {
  const { grossMinor, vatMinor, withholdingMinor, chargesMinor, mode } = params;
  let expectedCashMinor: number;
  let eligibleNetMinor: number;

  switch (mode) {
    case "vat_included":
      expectedCashMinor = grossMinor - withholdingMinor - chargesMinor;
      eligibleNetMinor = expectedCashMinor - vatMinor;
      break;
    case "vat_added":
      expectedCashMinor = grossMinor + vatMinor - withholdingMinor - chargesMinor;
      eligibleNetMinor = expectedCashMinor - vatMinor;
      break;
    case "reverse_charge":
      expectedCashMinor = grossMinor - withholdingMinor - chargesMinor;
      eligibleNetMinor = expectedCashMinor;
      break;
  }

  return { expectedCashMinor, eligibleNetMinor };
}

/** C02: same institution for bank+merchant = one introduction unit. */
export function consumesOneEntitlement(services: string[]): number {
  return 1;
}

/** C03: financing success only on first verified disbursement. */
export function qualifiesFinancingClient(hasPriorDisbursement: boolean): boolean {
  return !hasPriorDisbursement;
}

export function validateCurrency(currency: string): boolean {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(currency);
}
