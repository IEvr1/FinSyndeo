import { describe, expect, it } from "vitest";
import { buildTypedData } from "@/lib/questionnaire/buildTypedData";
import { isLegalEntityBankFlow } from "@/lib/questionnaire/flows";
import {
  isMeaningfulText,
  euAgentApplicable,
  licenceActive,
  LE_STRUCTURES,
} from "@/lib/questionnaire/legal-entity-bank-config";
import { validateLegalEntityBankFields } from "@/lib/questionnaire/validate-legal-entity-bank";
import { evaluateMatches, fixtureProfile, LEGAL_STRUCTURES } from "@/lib/matching";
import type { CountryPickers, QuestionnaireValues } from "@/lib/questionnaire/types";

function baseValues(): QuestionnaireValues {
  return {
    applicant: "company",
    "account-type": "bank",
    "entity-type": "Private limited company",
    "company-name": "Acme Trading Ltd",
    incorporation: "Cyprus",
    registration: "HE123456",
    "website-status": "available",
    website: "https://acme.example.com",
    industry: "Consulting & professional services",
    activity: "We provide management consulting services to mid-sized European companies.",
    licence: "No",
    offices: "incorporation",
    employees: "1–5",
    "le-acct:operating": true,
    "le-curr:EUR": true,
    "le-curr-level:EUR": "required",
    "le-in-count:operating:EUR": "1-10",
    "le-in-amount:operating:EUR": "0-50k",
    "le-in-purpose:operating:customer_receipts": true,
    "le-out-count:operating:EUR": "1-10",
    "le-out-amount:operating:EUR": "0-50k",
    "le-out-purpose:operating:suppliers": true,
    "existing-banking": "absent",
    corporate: "No",
    "le-bo-count": "1",
    "le-bo-pct:0": "100",
    "le-bo-res:0": "Cyprus",
    group: "No",
    "contact-name": "Jane Doe",
    "contact-email": "jane@example.com",
    "representative-role": "Director / officer",
    "representative-authority": true,
  };
}

function basePickers(): CountryPickers {
  return {
    "le-in-countries:operating": ["Germany"],
    "le-out-countries:operating": ["Germany"],
    "le-bo-nat:0": ["Cyprus"],
  };
}

function allSteps(values: QuestionnaireValues, pickers: CountryPickers) {
  return [1, 2, 3, 39, 4, 5].map((s) => validateLegalEntityBankFields(s, values, pickers)?.fields ?? {});
}

describe("LE bank journey", () => {
  it("detects the flow", () => {
    expect(isLegalEntityBankFlow(baseValues())).toBe(true);
    expect(isLegalEntityBankFlow({ applicant: "company", "account-type": "merchant" })).toBe(false);
  });

  it("accepts a complete private limited company", () => {
    for (const f of allSteps(baseValues(), basePickers())) expect(f).toEqual({});
  });

  it("maps every legal structure to the contract catalogue", () => {
    for (const s of LE_STRUCTURES) {
      expect((LEGAL_STRUCTURES.bank as readonly string[]).includes(s.contract)).toBe(true);
    }
  });

  it("rejects filler text and single letters", () => {
    expect(isMeaningfulText("a")).toBe(false);
    expect(isMeaningfulText("xxxx")).toBe(false);
    expect(isMeaningfulText("n/a")).toBe(false);
    expect(isMeaningfulText("Consulting for SMEs", 15)).toBe(true);
    const v = { ...baseValues(), activity: "a" };
    expect(validateLegalEntityBankFields(2, v, basePickers())?.fields.activity).toBeTruthy();
  });

  it("requires a website URL only when available, otherwise a reason", () => {
    const v = { ...baseValues(), "website-status": "under_development", website: "" };
    expect(validateLegalEntityBankFields(2, v, {})?.fields["website-reason"]).toBeTruthy();
    expect(validateLegalEntityBankFields(2, v, {})?.fields.website).toBeUndefined();
  });

  it("does not require registration for a trust marked not applicable", () => {
    const trust: QuestionnaireValues = {
      ...baseValues(),
      "entity-type": "Trust",
      "registration-notissued": true,
      registration: "",
      "trust-governing-law": "Jersey",
    };
    const r = validateLegalEntityBankFields(1, trust, {});
    expect(r).toBeNull();
    const missingLaw = { ...trust, "trust-governing-law": "" };
    expect(validateLegalEntityBankFields(1, missingLaw, {})?.fields["trust-governing-law"]).toBeTruthy();
  });

  it("shows licence fields immediately for regulated industries and requires them", () => {
    const v = { ...baseValues(), industry: "Forex brokerage & CFD dealing" };
    expect(licenceActive(v)).toBe(true);
    const f = validateLegalEntityBankFields(2, v, {})?.fields ?? {};
    expect(f["licence-name"]).toBeTruthy();
    expect(f["licence-reference"]).toBeTruthy();
    expect(f["licence-authority"]).toBeTruthy();
    expect(f["licence-jurisdiction"]).toBeTruthy();
  });

  it("asks about an EU payment agent only for gambling/forex outside the EU", () => {
    const v = {
      ...baseValues(),
      industry: "Gambling & betting — real-money wagering",
      incorporation: "Curaçao",
      "licence-jurisdiction": "Curaçao",
    };
    expect(euAgentApplicable(v)).toBe(true);
    expect(euAgentApplicable({ ...v, "licence-jurisdiction": "Malta" })).toBe(false);
    expect(euAgentApplicable({ ...v, incorporation: "Cyprus" })).toBe(false);
    expect(euAgentApplicable({ ...baseValues(), "licence-jurisdiction": "Curaçao" })).toBe(false);
  });

  it("requires client-funds schedule only when the dedicated account is selected", () => {
    const only = validateLegalEntityBankFields(3, baseValues(), basePickers());
    expect(only).toBeNull();
    const both = { ...baseValues(), "le-acct:client_funds": true };
    const f = validateLegalEntityBankFields(3, both, basePickers())?.fields ?? {};
    expect(f["le-in-count:client_funds:EUR"]).toBeTruthy();
    expect(f["le-out-count:client_funds:EUR"]).toBeTruthy();
  });

  it("requires at least one account type and currency", () => {
    const v = { ...baseValues(), "le-acct:operating": false };
    expect(validateLegalEntityBankFields(3, v, basePickers())?.fields["le-accounts"]).toBeTruthy();
    const v2 = { ...baseValues(), "le-curr:EUR": false };
    expect(validateLegalEntityBankFields(3, v2, basePickers())?.fields["le-currencies"]).toBeTruthy();
  });

  it("enforces 75–100% beneficial ownership coverage", () => {
    const low = { ...baseValues(), "le-bo-pct:0": "40" };
    expect(validateLegalEntityBankFields(4, low, basePickers())?.fields["le-bo-coverage"]).toBeTruthy();
    const high = { ...baseValues(), "le-bo-pct:0": "120" };
    expect(validateLegalEntityBankFields(4, high, basePickers())?.fields["le-bo-pct:0"]).toBeTruthy();
  });

  it("does not require group name, even after Yes then No", () => {
    const yes = { ...baseValues(), group: "Yes" };
    expect(validateLegalEntityBankFields(4, yes, basePickers())).toBeNull();
    const no = { ...yes, group: "No", "group-name": "" };
    expect(validateLegalEntityBankFields(4, no, basePickers())).toBeNull();
  });

  it("applies structure-specific ownership rules", () => {
    const trust: QuestionnaireValues = {
      ...baseValues(),
      "entity-type": "Trust",
      "le-trust-count": "3",
      "le-trust-role:0": "Settlor",
      "le-trust-res:0": "Jersey",
      "le-trust-role:1": "Trustee",
      "le-trust-res:1": "Jersey",
      "le-trust-role:2": "Beneficiary class",
      "le-trust-desc:2": "Children and grandchildren of the settlor",
      "le-trust-protector": "No",
    };
    const p = { "le-trust-nat:0": ["Jersey"], "le-trust-nat:1": ["Jersey"] };
    // trust uses prefix "trust" and key le-trust-count for rows
    const withCount = { ...trust, "le-trust-count": "3" };
    expect(validateLegalEntityBankFields(4, withCount, p)).toBeNull();

    const foundation: QuestionnaireValues = {
      ...baseValues(),
      "entity-type": "Foundation",
      "le-role-count": "1",
      "le-role-role:0": "Founder",
      "le-role-res:0": "Cyprus",
      "nonshare-structure": "A council of three members governs the foundation.",
    };
    expect(validateLegalEntityBankFields(4, foundation, { "le-role-nat:0": ["Cyprus"] })).toBeNull();
  });

  it("requires structure-specific capacity for contact", () => {
    const trust = { ...baseValues(), "entity-type": "Trust", "representative-role": "Authorised trust representative" };
    const r = validateLegalEntityBankFields(5, trust, {});
    expect(r?.fields["representative-firm"]).toBeTruthy();
    expect(r?.fields["representative-role"]).toBeUndefined();
  });
});

describe("LE bank typed data + matching", () => {
  it("emits anonymous ownership, account types, currency priorities and rails", () => {
    const v: QuestionnaireValues = {
      ...baseValues(),
      "le-acct:client_funds": true,
      "le-in-count:client_funds:EUR": "11-50",
      "le-in-amount:client_funds:EUR": "50k-200k",
      "le-in-purpose:client_funds:client_funds_in": true,
      "le-out-count:client_funds:EUR": "none",
      "le-out-amount:client_funds:EUR": "none",
      "le-rail:eur_sepa": true,
      "le-svc:cards": true,
      "le-svc-level:cards": "required",
    };
    const p: CountryPickers = { ...basePickers(), "le-in-countries:client_funds": ["France"] };
    const typed = buildTypedData(v, p) as Record<string, any>;
    expect(typed.applicant.entityType).toBe("Private limited company (Ltd / LLC or equivalent)");
    expect(typed.applicant.legalStructure).toBe("Private limited company");
    expect(typed.applicant.persons[0].anonymous).toBe(true);
    expect(typed.applicant.persons[0].fullName).toBeUndefined();
    const bank = typed.requirements.bank;
    expect(bank.accounts.requested).toBe("both");
    expect(bank.currencies).toEqual([{ key: "bank.currency.EUR", value: "EUR", level: "essential" }]);
    expect(bank.paymentMethods[0].priority).toBe("essential");
    expect(bank.paymentMethods[0].id).toBe("eur_sepa");
    expect(bank.schedules.client_funds.outgoing.active).toBe(false);
    expect(bank.capabilities.some((c: { value: string }) => c.value === "cards")).toBe(true);
    expect(JSON.stringify(typed)).not.toContain("CHF");
    expect(typed.business.euAgent).toBeNull();
  });

  it("treats operating-only support for a both-accounts request as partial coverage", () => {
    const v: QuestionnaireValues = {
      ...baseValues(),
      "le-acct:client_funds": true,
      "le-in-count:client_funds:EUR": "1-10",
      "le-in-amount:client_funds:EUR": "0-50k",
      "le-in-purpose:client_funds:client_funds_in": true,
      "le-out-count:client_funds:EUR": "none",
      "le-out-amount:client_funds:EUR": "none",
    };
    const typed = buildTypedData(v, { ...basePickers(), "le-in-countries:client_funds": ["France"] });
    const provider = { id: "p1", code: "P1", name: "Provider 1", country: "Cyprus", approved: true, agreement: true, active: true, introEligible: true };
    const result = evaluateMatches(typed as Record<string, unknown>, [provider], { p1: fixtureProfile(provider) });
    const row = result.matches[0];
    expect(row.coverageStatus).toBe("Partial coverage");

    const operatingOnly = buildTypedData(baseValues(), basePickers());
    const r2 = evaluateMatches(operatingOnly as Record<string, unknown>, [provider], { p1: fixtureProfile(provider) });
    expect(r2.matches[0].coverageStatus).not.toBe("Partial coverage");
  });
});
