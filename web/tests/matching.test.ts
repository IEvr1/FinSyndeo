import { describe, it, expect } from "vitest";
import { evaluateMatches, fixtureProfile } from "@/lib/matching";

describe("matching engine", () => {
  it("returns error without typed snapshot", () => {
    const result = evaluateMatches({}, [], {});
    expect(result.error).toBeTruthy();
  });

  it("separates eligible and conditional counts", () => {
    const snapshot = {
      route: "bank",
      applicant: { kind: "entity", name: "Test Ltd", jurisdiction: "Cyprus", registration: "HE123" },
      business: { industry: "Consulting & professional services", activity: "Consulting", office: "Yes", employees: "1" },
      requirements: {
        bank: {
          capabilities: [{ value: "sepa", level: "essential" }],
          currencies: [{ value: "EUR", level: "essential" }],
          incoming: { countries: ["Cyprus"], amount: 10000, count: 10 },
          outgoing: { countries: ["Cyprus"], amount: 10000, count: 10 },
        },
      },
      counterparties: [],
      screeningSubjects: [],
    };

    const provider = {
      id: "p1",
      code: "P14",
      name: "Example Bank",
      country: "Cyprus",
      approved: true,
      agreement: true,
      active: true,
    };

    const profiles = { p1: fixtureProfile(provider) };
    const result = evaluateMatches(snapshot, [provider], profiles);
    expect(result.matches.length).toBe(1);
    expect(typeof result.eligibleCount).toBe("number");
    expect(typeof result.conditionalCount).toBe("number");
  });
});
