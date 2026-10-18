import { criteria } from "@/lib/matching";
import { APPLICANT_ONBOARDING_METHODS, onboardingStorageKey } from "@/lib/onboarding-methods";
import type { CountryPickers, QuestionnaireValues } from "./types";
import { apiRouteFromValues, isPersonalFlow } from "./flows";
import {
  PB_CURRENCIES,
  PB_FUND_SOURCES,
  PB_SERVICES,
  PB_TRANSFER_PURPOSES,
  PB_WEALTH_SOURCES,
  currKey,
  fundKey,
  purposeKey,
  svcKey,
  svcLevelKey,
  wealthKey,
} from "./private-banking-config";

const C = criteria as {
  version: string;
  expandCountries: (list: string[]) => string[];
  currencyCodes: (chosen: string[], other?: string) => string[];
  capability: (family: string, label: string) => string | null;
  source: (label: string) => string;
  EU: string[];
};

function v(values: QuestionnaireValues, id: string): string {
  const raw = values[id];
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "boolean") return raw ? "Yes" : "";
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw).trim();
}

function n(values: QuestionnaireValues, id: string): number | null {
  const s = v(values, id);
  if (!s) return null;
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function chosen(values: QuestionnaireValues, prefix: string): string[] {
  return Object.entries(values)
    .filter(([key, val]) => key.startsWith(prefix) && val === true)
    .map(([key]) => key);
}

function expandPicker(p: CountryPickers, id: string): string[] {
  return C.expandCountries(p[id] ?? []);
}

function req(key: string, value: unknown, level: "essential" | "preferred" = "essential") {
  return { value, level, key };
}

function cap(family: string, labels: string[]) {
  const ids = [
    ...new Set(
      labels.flatMap((s) => {
        const id = C.capability(family, s);
        if (id === "online_pos") return ["online", "pos"];
        if (id === "sepa" && s === "SEPA / SEPA Instant") return ["sepa", "sepa_instant"];
        return id ? [id] : [];
      })
    ),
  ];
  return ids.map((x) => req(`${family}.capability.${x}`, x));
}

function curr(scope: string, codes: string[], other?: string) {
  return C.currencyCodes(codes, other).map((x) => req(`${scope}.currency.${x}`, x));
}

export function buildTypedData(values: QuestionnaireValues, pickers: CountryPickers) {
  const route = apiRouteFromValues(values);
  const personal = isPersonalFlow(values);
  const kinds = personal ? "individual" : route === "institution" ? "financial_institution" : "entity";

  const base: Record<string, unknown> = {
    schemaVersion: C.version,
    route,
    applicant: {
      kind: kinds,
      name: personal
        ? [v(values, "pb-name"), v(values, "pb-surname")].filter(Boolean).join(" ")
        : v(values, "company-name"),
      jurisdiction: personal ? v(values, "pb-residence") : v(values, "incorporation"),
      registration: personal || bool(values, "registration-notissued") ? null : v(values, "registration"),
      entityType: personal ? null : v(values, "entity-type"),
      personal: personal
        ? {
            name: v(values, "pb-name"),
            surname: v(values, "pb-surname"),
            nationalities: expandPicker(pickers, "pb-nationality"),
            residence: v(values, "pb-residence"),
            taxResidence: expandPicker(pickers, "pb-tax"),
          }
        : null,
      persons: [],
      shareholders: [],
      group: personal
        ? null
        : {
            member: v(values, "group") === "Yes",
            name: v(values, "group-name"),
            sameInstitution: v(values, "group-same-institution"),
          },
    },
    business: personal
      ? null
      : {
          industry: route === "institution" ? null : v(values, "industry"),
          otherIndustry: v(values, "industry-other"),
          activity: route === "institution" ? v(values, "fi-activities") : v(values, "activity"),
          website: route === "institution" ? v(values, "fi-website") : v(values, "website"),
          permissionRequired: v(values, "licence") === "Yes" || v(values, "licence") === "yes",
          permissions: [],
          office: v(values, "offices"),
          employees: v(values, "employees"),
          euAgent: v(values, "agent") || null,
        },
    requirements: {},
    counterparties: [],
    context: {
      contact: personal
        ? { name: v(values, "pb-name"), email: v(values, "pb-email") }
        : {
            name: v(values, "contact-name"),
            email: v(values, "contact-email"),
            capacity: v(values, "representative-role"),
            authority: bool(values, "representative-authority"),
          },
      legalChecks: "not_connected",
      fieldValues: values,
      countryPickers: pickers,
    },
  };

  if (["bank", "both"].includes(route)) {
    const purposeLabels = chosen(values, "purpose:").length
      ? chosen(values, "purpose:")
      : Object.entries(values)
          .filter(([k, val]) => val === true && k.startsWith("step:3::"))
          .map(([k]) => k);
    const labels: string[] = [];
    if (bool(values, "facility")) labels.push("Access a specific banking facility");
    (base.requirements as Record<string, unknown>).bank = {
      capabilities: cap("bank", labels.length ? labels : purposeLabels),
      otherCapability: v(values, "purpose-other-text") || v(values, "facilities-other"),
      currencies: curr("bank", checkboxList(values, "bank-currency"), v(values, "bank-other-text")),
      reportCurrency: v(values, "report-currency"),
      incoming: {
        countries: expandPicker(pickers, "bank-incoming-countries"),
        count: n(values, "bank-in-count"),
        amount: n(values, "bank-in-value"),
      },
      outgoing: {
        countries: expandPicker(pickers, "bank-outgoing-countries"),
        count: n(values, "bank-out-count"),
        amount: n(values, "bank-out-value"),
      },
      maxTransfer: n(values, "bank-max-transfer"),
      balance: n(values, "bank-min-balance"),
    };
  }

  if (["merchant", "both"].includes(route)) {
    const labels: string[] = [];
    if (bool(values, "online")) labels.push("Online card acquiring");
    if (bool(values, "pos")) labels.push("In-person card payments / POS");
    (base.requirements as Record<string, unknown>).merchant = {
      capabilities: cap("merchant", labels),
      salesModel: v(values, "sales-role"),
      cardCountries: parseCardCountries(values),
      chargeCurrencies: curr("merchant.charge", checkboxList(values, "charge-currencies"), ""),
      settlementCurrencies: curr("merchant.settlement", checkboxList(values, "settle-currencies"), ""),
      reportCurrency:
        v(values, "estimate-currency") === "Other"
          ? v(values, "estimate-other-code")
          : v(values, "estimate-currency"),
      monthlyAmount: n(values, "merchant-monthly-value"),
      monthlyCount: n(values, "merchant-monthly-count"),
      averageTicket: n(values, "merchant-average-ticket"),
      maxTicket: n(values, "merchant-max-ticket"),
      historyMonths: n(values, "history-months"),
      history: v(values, "history"),
      chargeback: n(values, "merchant-chargeback"),
      fraud: n(values, "merchant-fraud"),
      gateway: v(values, "gateway"),
      platform: v(values, "platform"),
      apms: v(values, "apm-request")
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      settlement: {
        exists: v(values, "settlement"),
        country: v(values, "settlement-country"),
        currencies: [],
        requestedBank: route === "both" || v(values, "find-bank") === "Yes",
      },
    };
  }

  if (route === "individual") {
    const capabilities = PB_SERVICES
      .filter((s) => bool(values, svcKey(s.id)))
      .flatMap((s) => {
        const capId = C.capability("private", s.matchLabel);
        if (!capId) return [];
        const level = v(values, svcLevelKey(s.id)) === "required" ? "essential" : "preferred";
        return [req(`private.capability.${capId}`, capId, level as "essential" | "preferred")];
      });

    const currencySelection = PB_CURRENCIES.filter((c) => c !== "Other" && bool(values, currKey(c)));
    const lang =
      v(values, "pb-language") === "Other"
        ? v(values, "pb-language-other")
        : v(values, "pb-language");

    (base.requirements as Record<string, unknown>).private = {
      capabilities,
      otherCapability: v(values, "pb-needs-text"),
      additionalNotes: v(values, "pb-needs-extra"),
      currencies: curr("private", currencySelection, v(values, "pb-currencies-text")),
      assets: parseAssetRange(v(values, "pb-assets")),
      placement: n(values, "pb-transfer"),
      placementCurrency: v(values, "pb-placement-currency") || "EUR",
      language: lang ? req("private.language", lang, v(values, "pb-language-level") === "required" ? "essential" : "preferred") : null,
      wealthSources: PB_WEALTH_SOURCES.filter((s) => bool(values, wealthKey(s.id))).map((s) => C.source(s.label)),
      fundSources: PB_FUND_SOURCES.filter((s) => bool(values, fundKey(s.id))).map((s) => C.source(s.label)),
      existingSavingsOrigin: PB_WEALTH_SOURCES.filter((s) => bool(values, `pb-fund-origin:${s.id}`)).map((s) =>
        C.source(s.label)
      ),
      ownFunds: v(values, "pb-own-funds"),
      fundOrigin: expandPicker(pickers, "pb-origin-country"),
      incoming: expandPicker(pickers, "pb-incoming"),
      outgoing: expandPicker(pickers, "pb-outgoing"),
      regularTransfers: v(values, "pb-regular-transfers"),
      transferDirection: v(values, "pb-transfer-direction"),
      transferPurposes: PB_TRANSFER_PURPOSES.filter((p) => bool(values, purposeKey(p))),
      transferPurposeOther: v(values, "pb-purpose-other"),
      monthlyIncoming: { count: n(values, "pb-in-count"), amount: n(values, "pb-in-amount") },
      monthlyOutgoing: { count: n(values, "pb-out-count"), amount: n(values, "pb-out-amount") },
      reportCurrency: v(values, "pb-report-currency"),
      occupation: v(values, "pb-occupation"),
      background: v(values, "pb-career"),
      linkedIn: v(values, "pb-linkedin"),
      existingRelationship: v(values, "pb-current-bank"),
      thirdPartyFunding:
        v(values, "pb-own-funds") === "No"
          ? {
              name: v(values, "pb-third-party-name"),
              relationship: v(values, "pb-third-party-relationship"),
              reason: v(values, "pb-third-party-reason"),
            }
          : null,
    };
  }

  if (route === "financing") {
    (base.requirements as Record<string, unknown>).finance = {
      capabilities: cap("finance", [v(values, "finance-purpose")]),
      otherCapability: v(values, "finance-other-text"),
      currencies: [
        req(
          "finance.currency." + v(values, "finance-currency"),
          v(values, "finance-currency") === "Other"
            ? v(values, "finance-currency-code").toUpperCase()
            : v(values, "finance-currency")
        ),
      ],
      amount: n(values, "finance-amount"),
      purpose: v(values, "finance-purpose"),
      stage: v(values, "finance-stage"),
      projectCountry: v(values, "finance-project-country"),
      termMonths: n(values, "finance-term-months"),
      security: v(values, "finance-security"),
      securityType: v(values, "finance-security-type"),
      existingDebt: v(values, "finance-existing"),
      auditYear: v(values, "finance-audit-year"),
      timeline: v(values, "finance-timeline"),
    };
  }

  if (route === "institution") {
    (base.requirements as Record<string, unknown>).correspondent = {
      capabilities: cap("correspondent", checkboxList(values, "fi-features")),
      currencies: curr("correspondent", checkboxList(values, "fi-currencies"), v(values, "fi-other-currency-text")),
      reportCurrency: v(values, "fi-reporting"),
      type: checkboxList(values, "fi-type")[0] ?? null,
      status: v(values, "fi-status"),
      authority: v(values, "fi-regulatory"),
      permission: v(values, "fi-reference"),
      permittedActivities: v(values, "fi-permitted"),
      underlyingTypes: checkboxList(values, "fi-clients"),
      underlyingDescription: v(values, "fi-client-profile"),
      underlyingCountries: expandPicker(pickers, "fi-underlying-countries").length
        ? expandPicker(pickers, "fi-underlying-countries")
        : expandPicker(pickers, "fi-client-countries"),
      operational: {
        countriesIn: expandPicker(pickers, "fi-incoming"),
        countriesOut: expandPicker(pickers, "fi-outgoing"),
        incoming: { amount: n(values, "fi-in-value"), count: n(values, "fi-in-count") },
        outgoing: { amount: n(values, "fi-out-value"), count: n(values, "fi-out-count") },
      },
      clientFunds: checkboxList(values, "fi-account-model").includes("Dedicated client-funds account")
        ? {
            countriesIn: expandPicker(pickers, "fi-client-in"),
            countriesOut: expandPicker(pickers, "fi-client-out"),
            incoming: { amount: n(values, "fi-client-in-value"), count: n(values, "fi-client-in-count") },
            outgoing: { amount: n(values, "fi-client-out-value"), count: n(values, "fi-client-out-count") },
          }
        : null,
      aml: v(values, "fi-aml"),
      ddq: v(values, "fi-ddq"),
      audit: v(values, "fi-audit"),
      mlro: v(values, "fi-mlro"),
      mlroCountry: v(values, "fi-mlro-country"),
    };
  }

  const applicant = base.applicant as { name: string; jurisdiction: string };
  base.screeningSubjects = [
    {
      id: "applicant",
      kind: personal ? "individual" : "entity",
      name: applicant.name,
      roles: ["applicant"],
      country: applicant.jurisdiction,
    },
  ];

  attachOnboardingPreferences(base, values);

  return base;
}

function readOnboardingMethods(values: QuestionnaireValues): string[] {
  if (values["onboarding-no-preference"] === true) return ["No preference"];
  return APPLICANT_ONBOARDING_METHODS.filter(
    (m) => m !== "No preference" && values[onboardingStorageKey(m)] === true
  );
}

function attachOnboardingPreferences(base: Record<string, unknown>, values: QuestionnaireValues) {
  const methods = readOnboardingMethods(values);
  const language = v(values, "relationship-manager-language");
  const languageLevel = v(values, "relationship-manager-language-level") || "preferred";
  const block = {
    onboardingMethods: methods,
    relationshipLanguage: language || null,
    relationshipLanguageLevel: language ? languageLevel : null,
  };
  const reqs = base.requirements as Record<string, Record<string, unknown>>;
  for (const key of Object.keys(reqs)) {
    reqs[key] = { ...reqs[key], ...block };
  }
}

function bool(values: QuestionnaireValues, id: string): boolean {
  const raw = values[id];
  return raw === true || raw === "true" || raw === "Yes" || raw === "on";
}

function checkboxList(values: QuestionnaireValues, idPrefix: string): string[] {
  if (Array.isArray(values[idPrefix])) return values[idPrefix] as string[];
  const direct = values[idPrefix];
  if (direct === true) return [idPrefix];
  return Object.entries(values)
    .filter(([k, v]) => v === true && (k === idPrefix || k.startsWith(`${idPrefix}-`) || k.includes(idPrefix)))
    .map(([k]) => k);
}

function parseCardCountries(values: QuestionnaireValues): Array<{ country: string; share: number | null }> {
  const rows: Array<{ country: string; share: number | null }> = [];
  for (let i = 0; i < 8; i += 1) {
    const country = v(values, `merchant-country-${i}`);
    const share = n(values, `merchant-share-${i}`);
    if (country || share !== null) rows.push({ country, share });
  }
  if (rows.length) return rows;
  const legacy = v(values, "merchant-card-countries");
  if (legacy) {
    return legacy.split(/[,;\n]+/).map((c) => ({ country: c.trim(), share: null }));
  }
  return [];
}

function parseAssetRange(assets: string): { min: number; max: number | null } | null {
  if (!assets) return null;
  if (/Below.*50/.test(assets)) return { min: 0, max: 50000 };
  if (assets.includes("50,000")) return { min: 50000, max: 100000 };
  if (assets.includes("100,000")) return { min: 100000, max: 500000 };
  if (assets.includes("500,000")) return { min: 500000, max: 1000000 };
  if (assets.includes("1 million")) return { min: 1000000, max: 5000000 };
  if (assets.startsWith("Above")) return { min: 5000000, max: null };
  return null;
}
