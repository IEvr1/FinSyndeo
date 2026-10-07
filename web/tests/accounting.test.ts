import { describe, it, expect } from "vitest";
import {
  resolveAutomaticTier,
  computeShareMinor,
  computeEligibleNet,
  consumesOneEntitlement,
  qualifiesFinancingClient,
} from "@/lib/accounting";

describe("accounting spec C01-C03", () => {
  it("C01 resolves tier at posting time", () => {
    expect(resolveAutomaticTier(1)).toBe(30);
    expect(resolveAutomaticTier(2)).toBe(40);
    expect(resolveAutomaticTier(3)).toBe(50);
  });

  it("computes share in minor units once", () => {
    expect(computeShareMinor(88000, 30)).toBe(26400);
  });

  it("C02 combined bank+merchant is one entitlement", () => {
    expect(consumesOneEntitlement(["bank", "merchant"])).toBe(1);
  });

  it("C03 financing qualifies only on first disbursement", () => {
    expect(qualifiesFinancingClient(false)).toBe(true);
    expect(qualifiesFinancingClient(true)).toBe(false);
  });

  it("VAT added separately example from spec", () => {
    const { expectedCashMinor, eligibleNetMinor } = computeEligibleNet({
      grossMinor: 100000,
      vatMinor: 20000,
      withholdingMinor: 10000,
      chargesMinor: 2000,
      mode: "vat_added",
    });
    expect(expectedCashMinor).toBe(108000);
    expect(eligibleNetMinor).toBe(88000);
  });
});
