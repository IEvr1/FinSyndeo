/**
 * Reference contract checks T01–T51 from Proofing Alignment and Matching Register.
 * These validate written comparison operators — not deployed SOPHIMA AI persistence/UI.
 */
import { describe, expect, it } from "vitest";
import {
  averageFromValueCount,
  closedInt,
  compareIntervalToCap,
  evaluateAccountRequest,
  evaluateAuditedYears,
  evaluateAuthorisation,
  evaluateBankRailsAll,
  evaluateCryptoExact,
  evaluateDistinctServices,
  evaluateEssentialCapabilities,
  evaluateEssentialIgnoringPreferences,
  evaluateEntitySupport,
  evaluateMaritimePurpose,
  evaluateOfferingEntity,
  evaluateSafeguarding,
  evaluateServiceInference,
  evaluateSettlementAny,
  evaluateSettlementTypes,
  getCountBand,
  isLegalStructureAllowed,
  marketMethodContribution,
  methodSupported,
  evaluateCompleteMultiServiceFit,
  overallMultiServiceFit,
  railsEquivalent,
  sumShares,
} from "@/lib/matching/contract";

describe("Matching contract T01–T51", () => {
  it("T01 All essential capabilities confirmed → Pass", () => {
    expect(
      evaluateEssentialCapabilities([
        { key: "a", status: "Supported" },
        { key: "b", status: "Supported" },
      ]).overall
    ).toBe("Pass");
  });

  it("T02 One essential capability unsupported → Fail", () => {
    expect(
      evaluateEssentialCapabilities([
        { key: "a", status: "Supported" },
        { key: "b", status: "Not supported" },
      ]).overall
    ).toBe("Fail");
  });

  it("T03 One essential capability unknown → Unresolved", () => {
    expect(
      evaluateEssentialCapabilities([
        { key: "a", status: "Supported" },
        { key: "b", status: "Not confirmed" },
      ]).overall
    ).toBe("Unresolved");
  });

  it("T04 Conditional permission unresolved → Unresolved", () => {
    expect(
      evaluateEssentialCapabilities([{ key: "cond", status: "Conditional" }]).overall
    ).toBe("Unresolved");
  });

  it("T05 Failure not rescued by other unknowns → Fail", () => {
    expect(
      evaluateEssentialCapabilities([
        { key: "a", status: "Not supported" },
        { key: "b", status: "Not confirmed" },
      ]).overall
    ).toBe("Fail");
  });

  it("T06 Essential SEPA and SWIFT both supported → Pass", () => {
    expect(
      evaluateBankRailsAll(["SEPA", "SWIFT"], {
        SEPA: "Supported",
        SWIFT: "Supported",
      }).overall
    ).toBe("Pass");
  });

  it("T07 Essential SEPA and SWIFT only SEPA supported → Fail", () => {
    expect(
      evaluateBankRailsAll(["SEPA", "SWIFT"], {
        SEPA: "Supported",
        SWIFT: "Not supported",
      }).overall
    ).toBe("Fail");
  });

  it("T08 Settlement SEPA or SWIFT compatible via SEPA → Pass", () => {
    expect(
      evaluateSettlementAny(["SEPA", "SWIFT"], {
        SEPA: "Supported",
        SWIFT: "Not supported",
      })
    ).toBe("Pass");
  });

  it("T09 Settlement only SWIFT receiving versus SEPA payout → Fail", () => {
    expect(
      evaluateSettlementAny(["SEPA"], {
        SWIFT: "Supported",
        SEPA: "Not supported",
      })
    ).toBe("Fail");
  });

  it("T10 Unknown receiving capability → Unresolved", () => {
    expect(
      evaluateSettlementAny(["SEPA"], {
        SEPA: "Not confirmed",
      })
    ).toBe("Unresolved");
  });

  it("T11 No selected bank rail creates no rail predicate → Pass", () => {
    const r = evaluateBankRailsAll([], {});
    expect(r.overall).toBe("Pass");
    expect(r.predicates[0]?.outcome).toBe("Not applicable");
  });

  it("T12 SEPA is not SEPA Instant → Fail", () => {
    expect(railsEquivalent("SEPA", "SEPA Instant")).toBe(false);
    // Provider confirmed SEPA only — SEPA Instant is a distinct unsupported rail
    expect(
      evaluateBankRailsAll(["SEPA Instant"], {
        SEPA: "Supported",
        "SEPA Instant": "Not supported",
      }).overall
    ).toBe("Fail");
  });

  it("T13 USD ACH not inferred from Fedwire → Fail", () => {
    expect(railsEquivalent("ACH", "Fedwire")).toBe(false);
    expect(
      evaluateBankRailsAll(["ACH"], {
        Fedwire: "Supported",
        ACH: "Not supported",
      }).overall
    ).toBe("Fail");
  });

  it("T14 Count interval 1 to 10 cap 10 → Pass", () => {
    expect(compareIntervalToCap(getCountBand("1-10"), 10)).toBe("Pass");
  });

  it("T15 Count interval 11 to 50 cap 50 → Pass", () => {
    expect(compareIntervalToCap(getCountBand("11-50"), 50)).toBe("Pass");
  });

  it("T16 Count interval 51 to 100 cap 50 → Fail", () => {
    expect(compareIntervalToCap(getCountBand("51-100"), 50)).toBe("Fail");
  });

  it("T17 Count interval 11 to 50 cap 25 → Unresolved", () => {
    expect(compareIntervalToCap(getCountBand("11-50"), 25)).toBe("Unresolved");
  });

  it("T18 Count interval 101 to inf cap 100000 → Unresolved", () => {
    // open-ended cannot fully satisfy a finite upper cap without clarification
    expect(compareIntervalToCap(getCountBand("over-100"), 100_000)).toBe("Unresolved");
  });

  it("T19 Count interval 101 to inf cap 100 → Fail", () => {
    expect(compareIntervalToCap(getCountBand("over-100"), 100)).toBe("Fail");
  });

  it("T20 Count interval 1 to 10 cap 5 → Unresolved", () => {
    expect(compareIntervalToCap(getCountBand("1-10"), 5)).toBe("Unresolved");
  });

  it("T21 Count interval 1 to 10 cap inf → Pass", () => {
    expect(compareIntervalToCap(getCountBand("1-10"), null)).toBe("Pass");
  });

  it("T22 Amount range crosses monthly cap → Unresolved", () => {
    expect(compareIntervalToCap(closedInt(40_000, 60_000), 50_000)).toBe("Unresolved");
  });

  it("T23 Amount range entirely inside limit → Pass", () => {
    expect(compareIntervalToCap(closedInt(10_000, 40_000), 50_000)).toBe("Pass");
  });

  it("T24 Unknown provider cap is not unlimited → Unresolved", () => {
    expect(compareIntervalToCap(closedInt(1, 10), undefined, { unknownCap: true })).toBe(
      "Unresolved"
    );
  });

  it("T25 Range below minimum fails → Fail", () => {
    expect(
      compareIntervalToCap(closedInt(1_000, 5_000), 100_000, { minimum: 10_000 })
    ).toBe("Fail");
  });

  it("T26 Same crypto asset different network fails → Fail", () => {
    expect(
      evaluateCryptoExact({
        requestedAsset: "USDC",
        requestedNetwork: "Ethereum",
        supportedAsset: "USDC",
        supportedNetwork: "Solana",
      })
    ).toBe("Fail");
  });

  it("T27 On ramp does not imply off ramp → Fail", () => {
    expect(
      evaluateDistinctServices({
        requested: "crypto_offramp",
        supported: ["crypto_onramp"],
      })
    ).toBe("Fail");
  });

  it("T28 Safeguarding not inferred from segregation → Fail", () => {
    expect(evaluateSafeguarding({ segregation: true, safeguarding: false })).toBe("Fail");
  });

  it("T29 Client account not inferred from operating → Fail", () => {
    expect(evaluateAccountRequest("clientFunds", { operating: true })).toBe("Fail");
  });

  it("T30 Both accounts require both support → Fail", () => {
    expect(evaluateAccountRequest("both", { operating: true, clientFunds: false })).toBe(
      "Fail"
    );
  });

  it("T31 BaaS not White Label → Fail", () => {
    expect(evaluateServiceInference("whiteLabel", { baas: true })).toBe("Fail");
  });

  it("T32 Acquiring not card issuing → Fail", () => {
    expect(evaluateServiceInference("cardIssuing", { acquiring: true })).toBe("Fail");
  });

  it("T33 Maritime not generic project finance → Fail", () => {
    expect(
      evaluateMaritimePurpose("maritime_vessel_finance", ["project_finance"])
    ).toBe("Fail");
  });

  it("T34 Audit years nonconsecutive fail consecutive set → Fail", () => {
    expect(
      evaluateAuditedYears({ availableYears: [2022, 2024], requiredConsecutive: 2 })
    ).toBe("Fail");
  });

  it("T35 Correct audited years available → Pass", () => {
    expect(
      evaluateAuditedYears({
        availableYears: [2023, 2024],
        requiredYears: [2023, 2024],
      })
    ).toBe("Pass");
  });

  it("T36 No merchant Trust intake → Fail", () => {
    expect(isLegalStructureAllowed("merchant", "Trust")).toBe("Fail");
  });

  it("T37 Financing LLP retained → Pass", () => {
    expect(isLegalStructureAllowed("financing", "LLP")).toBe("Pass");
  });

  it("T38 Merchant region split 20 percent times 50 percent → 10", () => {
    expect(marketMethodContribution(20, 50)).toBe(10);
  });

  it("T39 Market shares sum 100 percent → 100", () => {
    expect(sumShares([40, 35, 25])).toBe(100);
  });

  it("T40 Merchant value divided by comparable count → 60", () => {
    expect(averageFromValueCount(6000, 100)).toBe(60);
  });

  it("T41 Known unsupported required future method → Fail", () => {
    expect(methodSupported("Apple Pay", ["Card"])).toBe("Fail");
  });

  it("T42 Named wallet not inferred from Card → Fail", () => {
    expect(
      methodSupported("Digital wallet", ["Card"], { inferCardImpliesWallet: true })
    ).toBe("Fail");
  });

  it("T43 Required both settlement types uses AND → Fail", () => {
    expect(
      evaluateSettlementTypes({
        mode: "both",
        fiat: "Supported",
        crypto: "Not supported",
      })
    ).toBe("Fail");
  });

  it("T44 Either settlement type uses OR → Pass", () => {
    expect(
      evaluateSettlementTypes({
        mode: "either",
        fiat: "Supported",
        crypto: "Not supported",
      })
    ).toBe("Pass");
  });

  it("T45 Corporate support does not establish Trust support → Fail", () => {
    expect(
      evaluateEntitySupport("Trust", ["Private limited company", "Public company"])
    ).toBe("Fail");
  });

  it("T46 Group brand not actual offering entity → Fail", () => {
    expect(
      evaluateOfferingEntity({
        groupBrand: "Acme",
        requestedEntity: "Acme Merchant Ltd",
        approvedEntities: ["Acme Bank SA"],
      })
    ).toBe("Fail");
  });

  it("T47 Unconfirmed authorisation remains unresolved → Unresolved", () => {
    expect(evaluateAuthorisation("Not confirmed")).toBe("Unresolved");
  });

  it("T48 Both services requested one only fails complete fit → Fail", () => {
    const services = [
      { id: "bank", outcome: "Pass" as const },
      { id: "merchant", outcome: "Fail" as const },
    ];
    expect(evaluateCompleteMultiServiceFit(services)).toBe("Fail");
    expect(overallMultiServiceFit(services)).toBe("Partial coverage");
  });

  it("T49 Both services confirmed passes capability set → Pass", () => {
    const services = [
      { id: "bank", outcome: "Pass" as const },
      { id: "merchant", outcome: "Pass" as const },
    ];
    expect(evaluateCompleteMultiServiceFit(services)).toBe("Pass");
    expect(overallMultiServiceFit(services)).toBe("Complete potential fit");
  });

  it("T50 Nice to have gap absent from essential predicate → Pass", () => {
    expect(
      evaluateEssentialIgnoringPreferences({
        essentials: [
          { key: "a", outcome: "Pass" },
          { key: "b", outcome: "Pass" },
        ],
        preferenceGaps: ["language.french"],
      })
    ).toBe("Pass");
  });

  it("T51 Unselected inactive client schedule absent → Not applicable / Pass", () => {
    const r = evaluateBankRailsAll([], {});
    expect(r.predicates.every((p) => p.outcome === "Not applicable")).toBe(true);
    expect(r.overall).toBe("Pass");
  });
});
