import { describe, expect, it } from "vitest";
import {
  FINANCE_ENTITY_TYPES,
  FINANCE_PURPOSES,
  completedFinancialYears,
  financePurposeKey,
  isFinanceEntityTypeAllowed,
} from "@/lib/questionnaire/financing-config";
import {
  activeAuditedYears,
  validateFinancingFields,
} from "@/lib/questionnaire/validate-financing";
import { evaluateMaritimePurpose } from "@/lib/matching/contract/financing";

describe("financing FN catalogue", () => {
  it("limits entity types to the three approved forms", () => {
    expect(FINANCE_ENTITY_TYPES).toEqual([
      "Private limited company (Ltd / LLC or equivalent)",
      "Partnership",
      "Limited liability partnership (LLP)",
    ]);
    expect(isFinanceEntityTypeAllowed("Public limited company (PLC or equivalent)")).toBe(false);
    expect(isFinanceEntityTypeAllowed("Partnership")).toBe(true);
  });

  it("includes maritime_vessel_finance with Shipping finance alias", () => {
    expect(FINANCE_PURPOSES.some((p) => p.key === "maritime_vessel_finance")).toBe(true);
    expect(financePurposeKey("Maritime / vessel finance")).toBe("maritime_vessel_finance");
    expect(financePurposeKey("Shipping finance")).toBe("maritime_vessel_finance");
    expect(financePurposeKey("Refinancing existing borrowing")).toBe("refinancing");
  });

  it("maps maritime matching without treating project finance as vessel support", () => {
    expect(evaluateMaritimePurpose("maritime_vessel_finance", ["project_finance"])).toBe("Fail");
    expect(evaluateMaritimePurpose("maritime_vessel_finance", ["maritime_vessel_finance"])).toBe("Pass");
    expect(evaluateMaritimePurpose("Shipping finance", ["maritime_vessel_finance"])).toBe("Pass");
  });
});

describe("financing validation branches", () => {
  it("FN08: No existing financing does not require lender text", () => {
    const result = validateFinancingFields(
      14,
      {
        "finance-existing": "No",
        "finance-security": "No",
        "finance-purpose": "working_capital",
      },
      {}
    );
    expect(result).toBeNull();
  });

  it("FN08: Yes existing financing requires facility fields", () => {
    const result = validateFinancingFields(
      14,
      {
        "finance-existing": "Yes",
        "finance-security": "No",
        "finance-purpose": "working_capital",
        "finance-facility-count": "1",
      },
      {}
    );
    expect(result?.fields["finance-facilities"] || result?.fields["finance-facility-0-lender"]).toBeTruthy();
  });

  it("FN09: No security does not require asset details", () => {
    const result = validateFinancingFields(
      14,
      {
        "finance-existing": "No",
        "finance-security": "No",
        "finance-purpose": "working_capital",
      },
      {}
    );
    expect(result).toBeNull();
  });

  it("FN07: audited years are rolling and only required when Yes", () => {
    const years = completedFinancialYears(new Date("2026-10-21"));
    expect(years).toEqual([2025, 2024, 2023, 2022, 2021]);
    const hidden = validateFinancingFields(
      13,
      {
        "finance-purpose": "working_capital",
        "finance-stage": "In progress",
        "finance-revenue-status": "Pre-revenue / no revenue yet",
        "finance-report-currency": "EUR",
        "finance-audited": "No",
      },
      {}
    );
    expect(hidden).toBeNull();
    const yes = validateFinancingFields(
      13,
      {
        "finance-purpose": "working_capital",
        "finance-stage": "In progress",
        "finance-revenue-status": "Pre-revenue / no revenue yet",
        "finance-report-currency": "EUR",
        "finance-audited": "Yes",
      },
      {}
    );
    expect(yes?.fields["finance-audit-years"]).toBeTruthy();
    expect(
      activeAuditedYears({
        "finance-audited": "Yes",
        "finance-audit-year-2025": true,
        "finance-audit-year-2023": true,
      })
    ).toEqual([2025, 2023]);
  });

  it("FN01: unsupported entity type is blocked", () => {
    const result = validateFinancingFields(
      1,
      {
        "company-name": "Acme PLC",
        incorporation: "United Kingdom",
        registration: "123",
        "entity-type": "Public limited company (PLC or equivalent)",
      },
      {}
    );
    expect(result?.fields["entity-type"]).toMatch(/outside the current financing scope/i);
  });

  it("FN04: CHF / Other currency path is rejected", () => {
    const result = validateFinancingFields(
      12,
      {
        "finance-purpose": "working_capital",
        "finance-amount": "100000",
        "finance-currency": "CHF",
        "finance-use": "working capital for contracted freight services",
        "finance-timeline": "within_1_3_months",
        "finance-term": "3",
      },
      {}
    );
    expect(result?.fields["finance-currency"]).toBeTruthy();
  });
});
