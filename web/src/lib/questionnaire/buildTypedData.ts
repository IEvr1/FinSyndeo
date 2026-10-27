import { criteria } from "@/lib/matching";
import { APPLICANT_ONBOARDING_METHODS, onboardingStorageKey } from "@/lib/onboarding-methods";
import type { CountryPickers, QuestionnaireValues } from "./types";
import { apiRouteFromValues, isLegalEntityBankFlow, isPersonalFlow } from "./flows";
import {
  financePurposeFromValue,
  financePurposeKey,
} from "./financing-config";
import { deriveAverage, parseMarkets } from "./merchant-config";
import {
  CO_ACCOUNT_STRUCTURES,
  CO_CLIENT_TYPES,
  CO_CURRENCIES,
  CO_INSTITUTION_CATEGORIES,
  CO_PAYMENT_ROUTES,
  CO_REGIONS,
  CO_SERVICES,
  coClientTypeKey,
  coCurrKey,
  coCurrLevelKey,
  coRailKey,
  coRegionKey,
  coStructKey,
  coSvcKey,
  flowCountriesKey,
  flowKey,
  parseJsonList,
  type CoCorporateShareholder,
  type CoExistingProvider,
  type CoUbo,
  websiteUnavailableKey,
} from "./correspondent-config";
import {
  PB_BASELINE_ACCOUNT,
  PB_CURRENCIES,
  PB_INCOMING_PURPOSES,
  PB_OUTGOING_PURPOSES,
  PB_PAYMENT_ROUTES,
  PB_SERVICES,
  PB_WEALTH_SOURCES,
  currKey,
  currLevelKey,
  inAmountKey,
  inCountKey,
  inPurposeKey,
  outAmountKey,
  outCountKey,
  outPurposeKey,
  railKey,
  svcKey,
  svcLevelKey,
  wealthKey,
} from "./private-banking-config";
import { activeCorrespondentBranch } from "./validate-correspondent";
import { applyLegalEntityBank } from "./legal-entity-bank-typed";
import { activeAuditedYears, activeFinanceFacilities } from "./validate-financing";

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
        // SEPA and SEPA Instant are distinct rails (T12 / M06); never expand a combined label.
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
      entityType: personal
        ? null
        : route === "institution"
          ? "Private limited company (Ltd / LLC or equivalent)"
          : v(values, "entity-type"),
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

  // LE bank journey (LE01–LE23) builds its own typed bank block via applyLegalEntityBank().
  const leBank = isLegalEntityBankFlow(values);

  if (["bank", "both"].includes(route) && !leBank) {
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
    if (bool(values, "online") || bool(values, "merchant-channel:online")) {
      labels.push("Online card payments");
    }
    if (bool(values, "pos") || bool(values, "merchant-channel:pos")) {
      labels.push("In-person card payments / POS");
    }
    const markets = parseMarkets(values);
    const settleCurrencies = ["EUR", "GBP", "USD"].filter(
      (c) => bool(values, `merchant-settle-curr:${c}`) || bool(values, `settle:${c}`)
    );
    const processingCurrencies = Array.from(
      new Set(
        markets.flatMap((m) =>
          m.methods.flatMap((method) =>
            method.currencies.map((c) => c.currency).filter(Boolean)
          )
        )
      )
    );
    (base.requirements as Record<string, unknown>).merchant = {
      capabilities: cap("merchant", labels),
      salesModel: v(values, "sales-role"),
      markets,
      cardCountries: markets
        .filter((m) => m.kind === "country")
        .map((m) => m.name)
        .filter(Boolean),
      chargeCurrencies: curr("merchant.charge", processingCurrencies, ""),
      settlementCurrencies: curr("merchant.settlement", settleCurrencies, ""),
      settlementType: v(values, "merchant-settlement-type"),
      historyStatus: v(values, "merchant-history-status") || v(values, "history"),
      historyMonths: n(values, "history-months") || n(values, "merchant-history-months"),
      statementAvailability: v(values, "merchant-statement-availability"),
      gateway: v(values, "gateway") || v(values, "merchant-gateway"),
      gatewayKeep: v(values, "merchant-gateway-keep"),
      platform: v(values, "platform") || v(values, "merchant-platform"),
      fulfilment: v(values, "merchant-fulfilment"),
      targetRate: v(values, "merchant-target-rate"),
      // MC11: average is derived from comparable value/count only — no max/typical ticket inputs.
      derivedAverages: markets.flatMap((m) =>
        m.methods.flatMap((method) =>
          method.currencies
            .map((c) => ({
              market: m.name,
              method: method.method,
              currency: c.currency,
              average: deriveAverage(c.monthlyValue, c.monthlyCount),
            }))
            .filter((row) => row.average != null)
        )
      ),
      settlement: {
        exists: v(values, "merchant-receiving-account") || v(values, "settlement"),
        ownNameAcknowledged: bool(values, "merchant-own-name-ack"),
        currencies: settleCurrencies,
        requestedBank: route === "both" || v(values, "find-bank") === "Yes",
        bankEntry: v(values, "bank-entry"),
      },
    };
  }

  if (route === "individual") {
    const baselineId = C.capability("private", PB_BASELINE_ACCOUNT.matchLabel);
    const baselineCap = baselineId
      ? [req(`private.capability.${baselineId}`, baselineId, "essential")]
      : [];

    const extraCapabilities = PB_SERVICES
      .filter((s) => bool(values, svcKey(s.id)))
      .flatMap((s) => {
        const capId = C.capability("private", s.matchLabel);
        if (!capId) return [];
        const level = v(values, svcLevelKey(s.id)) === "required" ? "essential" : "preferred";
        return [req(`private.capability.${capId}`, capId, level as "essential" | "preferred")];
      });

    const currencySelection = PB_CURRENCIES.filter((c) => bool(values, currKey(c)));
    const currencyReqs = currencySelection.map((code) =>
      req(
        `private.currency.${code}`,
        code,
        v(values, currLevelKey(code)) === "required" ? "essential" : "preferred"
      )
    );
    const rails = PB_PAYMENT_ROUTES.filter((r) => bool(values, railKey(r.id))).map((r) => ({
      id: r.id,
      currency: r.currency,
      label: r.label,
      priority: v(values, currLevelKey(r.currency)) === "required" ? "essential" : "preferred",
    }));

    const lang =
      v(values, "pb-language") === "Other"
        ? v(values, "pb-language-other")
        : v(values, "pb-language");

    const incomingInactive = bool(values, "pb-incoming-none");
    const outgoingInactive = bool(values, "pb-outgoing-none");
    const regular = v(values, "pb-regular-transfers");

    const monthlyByCurrency = currencySelection.map((code) => ({
      currency: code,
      incoming:
        regular === "Yes" && !incomingInactive
          ? { countBand: v(values, inCountKey(code)), amountBand: v(values, inAmountKey(code)) }
          : null,
      outgoing:
        regular === "Yes" && !outgoingInactive
          ? { countBand: v(values, outCountKey(code)), amountBand: v(values, outAmountKey(code)) }
          : null,
    }));

    (base.requirements as Record<string, unknown>).private = {
      capabilities: [...baselineCap, ...extraCapabilities],
      accountImplicit: true,
      otherCapability: v(values, "pb-needs-text"),
      additionalNotes: v(values, "pb-needs-extra"),
      currencies: currencyReqs.length ? currencyReqs : curr("private", currencySelection),
      paymentMethods: rails,
      assets: parseAssetRange(v(values, "pb-assets")),
      placement: n(values, "pb-transfer"),
      placementCurrency: "EUR",
      language: lang ? req("private.language", lang, v(values, "pb-language-level") === "required" ? "essential" : "preferred") : null,
      wealthSources: PB_WEALTH_SOURCES.filter((s) => bool(values, wealthKey(s.id))).map((s) => C.source(s.label)),
      // Proposed source-of-funds removed (PB04); keep empty so matching treats as unknown/conditional.
      fundSources: [],
      ownFunds: v(values, "pb-own-funds"),
      fundOrigin: expandPicker(pickers, "pb-origin-country"),
      incoming: regular === "Yes" && !incomingInactive ? expandPicker(pickers, "pb-incoming") : [],
      outgoing: regular === "Yes" && !outgoingInactive ? expandPicker(pickers, "pb-outgoing") : [],
      regularTransfers: regular,
      incomingInactive: regular === "Yes" ? incomingInactive : null,
      outgoingInactive: regular === "Yes" ? outgoingInactive : null,
      incomingPurposes:
        regular === "Yes" && !incomingInactive
          ? PB_INCOMING_PURPOSES.filter((p) => bool(values, inPurposeKey(p.id))).map((p) => p.id)
          : [],
      incomingPurposeOther: v(values, "pb-in-purpose-other"),
      outgoingPurposes:
        regular === "Yes" && !outgoingInactive
          ? PB_OUTGOING_PURPOSES.filter((p) => bool(values, outPurposeKey(p.id))).map((p) => p.id)
          : [],
      outgoingPurposeOther: v(values, "pb-out-purpose-other"),
      monthlyByCurrency,
      occupation: v(values, "pb-occupation"),
      background: v(values, "pb-career"),
      linkedIn: v(values, "pb-linkedin"),
      existingRelationship: v(values, "pb-current-bank"),
      thirdPartyFunding:
        v(values, "pb-own-funds") === "No"
          ? {
              name: v(values, "pb-third-party-name") || null,
              relationship: v(values, "pb-third-party-relationship"),
              relationshipOther: v(values, "pb-third-party-relationship-other"),
              reason: v(values, "pb-third-party-reason"),
            }
          : null,
    };
  }

  if (route === "financing") {
    const purposeMeta = financePurposeFromValue(v(values, "finance-purpose"));
    const purposeKey = purposeMeta?.key ?? financePurposeKey(v(values, "finance-purpose"));
    const purposeLabel = purposeMeta?.label ?? v(values, "finance-purpose");
    const existingFinancing = v(values, "finance-existing") === "Yes";
    const securityYes = v(values, "finance-security") === "Yes";
    const termUnknown = values["finance-term-unknown"] === true;
    const facilities = activeFinanceFacilities(values);
    const auditedYears = activeAuditedYears(values);
    const matchLabels = [purposeLabel];
    if (purposeKey === "maritime_vessel_finance") {
      matchLabels.push("Maritime / vessel finance", "Shipping finance");
    }
    (base.requirements as Record<string, unknown>).finance = {
      capabilities: cap("finance", matchLabels),
      otherCapability: purposeKey === "other" ? v(values, "finance-other-text") : null,
      currencies: [req("finance.currency." + v(values, "finance-currency"), v(values, "finance-currency"))],
      amount: n(values, "finance-amount"),
      purpose: purposeKey,
      purposeLabel,
      useOfFunds: v(values, "finance-use"),
      stage: v(values, "finance-stage"),
      projectCountry: v(values, "finance-project-country") || null,
      vesselDetails:
        purposeKey === "maritime_vessel_finance" ? v(values, "finance-vessel-details") || null : null,
      termYears: termUnknown ? null : n(values, "finance-term"),
      termUnknown,
      timeline: v(values, "finance-timeline"),
      requiredDate:
        v(values, "finance-timeline") === "specific_date" ? v(values, "finance-date") || null : null,
      revenueStatus: v(values, "finance-revenue-status") || null,
      reportingCurrency: v(values, "finance-report-currency") || null,
      revenue: n(values, "finance-revenue"),
      revenueYear: v(values, "finance-revenue-year") || null,
      profit: n(values, "finance-profit"),
      auditedAvailability: v(values, "finance-audited") || null,
      auditedYears,
      latestAuditedYear: auditedYears.length ? Math.max(...auditedYears) : null,
      existingFinancing,
      facilities: existingFinancing ? facilities : [],
      refinanceTargets:
        purposeKey === "refinancing" && existingFinancing ? v(values, "finance-refinance") || null : null,
      securityAvailable: securityYes,
      security: securityYes
        ? {
            details: v(values, "finance-security-details"),
            value: n(values, "finance-security-value"),
            currency: v(values, "finance-security-currency") || null,
            pledged: v(values, "finance-pledged") || null,
          }
        : null,
      websiteStatus: v(values, "finance-website-status") || null,
      website: v(values, "finance-website-status") === "available" ? v(values, "website") || null : null,
      // FN12/FN13: never export cross-service prefs or onboarding methods for financing
      onboardingMethods: [],
      groupCompanyCrossService: null,
      uboPersonalAccount: null,
    };
    // Strip any inherited onboarding from shared attach below for this route.
    (base as { financingExcludesOnboarding?: boolean }).financingExcludesOnboarding = true;
  }

  if (route === "institution") {
    const branch = activeCorrespondentBranch(values);
    const catLabel =
      CO_INSTITUTION_CATEGORIES.find((c) => c.id === branch.category)?.label ?? branch.category;
    const selectedServices = branch.selectedServices.map((s) => s.matchLabel);
    const currencyReqs = branch.selectedCurrencies.map((code) =>
      req(
        `correspondent.currency.${code}`,
        code,
        v(values, coCurrLevelKey(code)) === "required" ? "essential" : "preferred"
      )
    );
    const rails = CO_PAYMENT_ROUTES.filter((r) => bool(values, coRailKey(r.id))).map((r) => ({
      id: r.id,
      currency: r.currency,
      label: r.label,
      level: v(values, coCurrLevelKey(r.currency)) === "required" ? "essential" : "preferred",
    }));
    const structures = CO_ACCOUNT_STRUCTURES.filter((s) => bool(values, coStructKey(s.id))).map(
      (s) => s.id
    );
    const regions = CO_REGIONS.filter((r) => bool(values, coRegionKey(r))).map((r) => r);
    const clientTypes = CO_CLIENT_TYPES.filter((t) => bool(values, coClientTypeKey(t.id))).map(
      (t) => t.label
    );

    function schedule(scope: "operating" | "client", code: string) {
      const buildDir = (dir: "in" | "out") => ({
        amount: v(values, flowKey(scope, code, dir, "amount")) || null,
        count: v(values, flowKey(scope, code, dir, "count")) || null,
        purpose: v(values, flowKey(scope, code, dir, "purpose")) || null,
        countries: expandPicker(pickers, flowCountriesKey(scope, code, dir)),
      });
      return { currency: code, incoming: buildDir("in"), outgoing: buildDir("out") };
    }

    const operatingSchedules = branch.selectedCurrencies.map((c) => schedule("operating", c));
    const clientSchedules = branch.clientFunds
      ? branch.selectedCurrencies.map((c) => schedule("client", c))
      : [];

    const ubos = parseJsonList<CoUbo>(values["co-ubos"]).map((u) => ({
      ownershipPct: Number(u.ownership) || null,
      nationalities: pickers[`co-ubo-nat-${u.id}`] ?? u.nationalities ?? [],
      residence: u.residence || null,
    }));
    const corporateShareholders = branch.corporateYes
      ? parseJsonList<CoCorporateShareholder>(values["co-corporate-shareholders"]).map((c) => ({
          jurisdiction: c.jurisdiction || null,
          shareholdingPct: Number(c.shareholding) || null,
        }))
      : [];
    const existingProviders = parseJsonList<CoExistingProvider>(values["co-existing-providers"])
      .filter((p) => p.name || p.country || p.status)
      .map((p) => ({ name: p.name || null, country: p.country || null, status: p.status || null }));

    (base.applicant as Record<string, unknown>).website =
      values[websiteUnavailableKey()] === true ? null : v(values, "fi-website") || null;
    (base.applicant as Record<string, unknown>).websiteUnavailable =
      values[websiteUnavailableKey()] === true
        ? { reason: v(values, "co-website-reason") || null }
        : null;
    (base.applicant as Record<string, unknown>).shareholders = corporateShareholders;
    (base.applicant as Record<string, unknown>).persons = ubos.map((u, i) => ({
      id: `ubo-${i + 1}`,
      roles: ["beneficial_owner"],
      ownershipPct: u.ownershipPct,
      nationalities: u.nationalities,
      residence: u.residence,
    }));
    (base.applicant as Record<string, unknown>).group = {
      member: branch.groupYes,
      name: branch.groupYes ? v(values, "group-name") || null : null,
      sameInstitution: v(values, "group-same-institution") || null,
      uboPersonalAccount: v(values, "group-ubo-personal") || null,
    };

    (base.requirements as Record<string, unknown>).correspondent = {
      institutionCategory: branch.category || null,
      institutionCategoryLabel: catLabel || null,
      /** Matching criterion institution.type — same as category label. */
      type: catLabel || null,
      capabilities: selectedServices.map((label) => {
        const svc = CO_SERVICES.find((s) => s.matchLabel === label);
        return req(`correspondent.capability.${svc?.id ?? label}`, svc?.id ?? label, "essential");
      }),
      otherCapability: bool(values, coSvcKey("other")) ? v(values, "co-svc-other-text") : null,
      currencies: currencyReqs,
      rails,
      accountStructures: structures,
      operatingAccount: true,
      clientFundsAccount: branch.clientFunds,
      status: v(values, "fi-status"),
      authority: v(values, "fi-regulatory"),
      permission: v(values, "fi-reference"),
      permittedActivities: v(values, "fi-permitted") || null,
      registerLink: v(values, "fi-register-link") || null,
      operatingModel: v(values, "fi-activities") || null,
      underlyingTypes: clientTypes,
      underlyingDescription: v(values, "fi-client-profile"),
      broadRegions: regions,
      underlyingCountries: expandPicker(pickers, "fi-underlying-countries"),
      nestedProcessing: v(values, "fi-downstream"),
      nestedProcessingDetails:
        v(values, "fi-downstream") === "Yes" ? v(values, "fi-downstream-text") : null,
      directClientAccess: v(values, "fi-access"),
      directClientAccessDetails: v(values, "fi-access") === "Yes" ? v(values, "fi-access-text") : null,
      fundModel: v(values, "fi-fund-model"),
      operationalSchedules: operatingSchedules,
      clientFundsSchedules: clientSchedules,
      // Inactive when client funds deselected — never export stale client schedules as active.
      clientFunds: branch.clientFunds
        ? {
            schedules: clientSchedules,
          }
        : null,
      aml: v(values, "fi-aml"),
      // CO08: DDQ availability/year removed from active correspondent intake.
      ddq: null,
      audit: v(values, "fi-audit"),
      auditYear: v(values, "fi-audit") === "Yes" ? v(values, "fi-audit-year") : null,
      mlro: v(values, "fi-mlro"),
      mlroCountry: v(values, "fi-mlro-country"),
      relationshipReason: v(values, "fi-reason"),
      existingProviders,
      msbCanada: branch.isMsbCanada
        ? {
            office: v(values, "msb-office"),
            director: v(values, "msb-director"),
            bankOfCanada: v(values, "msb-boc"),
            reference: v(values, "msb-boc-reference") || null,
          }
        : null,
      casp: branch.isCasp
        ? {
            mica: v(values, "casp-mica"),
            authority: v(values, "casp-authority") || null,
            reference: v(values, "casp-reference") || null,
            assets: v(values, "casp-assets"),
            wallets: v(values, "casp-wallets"),
            travelRule: v(values, "casp-travel"),
            chainScreening: v(values, "casp-chain"),
          }
        : null,
      ownershipClarification: v(values, "ownership-clarification") || null,
    };
  }

  if (leBank) applyLegalEntityBank(base, values, pickers);

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

  if (route !== "financing") {
    attachOnboardingPreferences(base, values);
  } else {
    // FN13: language may still be preferred; onboarding methods must not affect matching.
    const language = v(values, "relationship-manager-language");
    const reqs = base.requirements as Record<string, Record<string, unknown>>;
    if (reqs.finance) {
      reqs.finance = {
        ...reqs.finance,
        onboardingMethods: [],
        relationshipLanguage: language || null,
        relationshipLanguageOther:
          language === "Other" ? v(values, "relationship-manager-language-other") || null : null,
      };
    }
  }

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
