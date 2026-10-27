/**
 * Typed-data builder for the Legal Entity → Business bank account journey (LE01–LE23).
 * Called from buildTypedData() after the common envelope has been created; it replaces the
 * applicant / business / requirements.bank blocks with structure-aware, anonymous-ownership data.
 */

import { criteria } from "@/lib/matching";
import {
  LE_ACCOUNTS,
  LE_CURRENCIES,
  LE_PURPOSES,
  LE_RAILS,
  LE_SERVICES,
  directionActive,
  euAgentApplicable,
  flowPurposes,
  isTrust,
  leAmountKey,
  leCorpJurKey,
  leCorpPctKey,
  leCountKey,
  leCountriesId,
  leCountriesUnknownKey,
  leCurrKey,
  leCurrLevelKey,
  leFlowPurposeKey,
  leFlowPurposeOtherKey,
  licenceActive,
  lePersonCountKey,
  lePersonKey,
  lePersonNatId,
  lePurposeKey,
  leRailKey,
  leSvcKey,
  leSvcLevelKey,
  ownershipGroup,
  personPrefix,
  priorityOf,
  rowCount,
  selectedAccounts,
  selectedCurrencies,
  structureByLabel,
  type LeDirection,
} from "./legal-entity-bank-config";
import type { CountryPickers, QuestionnaireValues } from "./types";

const C = criteria as {
  expandCountries: (list: string[]) => string[];
  capability: (family: string, label: string) => string | null;
};

function s(values: QuestionnaireValues, key: string): string {
  const raw = values[key];
  if (raw === undefined || raw === null || typeof raw === "boolean") return "";
  return Array.isArray(raw) ? raw.join(", ") : String(raw).trim();
}

function b(values: QuestionnaireValues, key: string): boolean {
  return values[key] === true;
}

function req(key: string, value: unknown, level: "essential" | "preferred") {
  return { value, level, key };
}

function expand(pickers: CountryPickers, id: string): string[] {
  return C.expandCountries(pickers[id] ?? []);
}

const COUNT_MAX: Record<string, number | null> = { "1-10": 10, "11-50": 50, "51-100": 100, "over-100": 101, none: 0, unknown: null };
const AMOUNT_MAX: Record<string, number | null> = {
  "0-50k": 50_000,
  "50k-200k": 200_000,
  "200k-500k": 500_000,
  "500k-1m": 1_000_000,
  "over-1m": 1_000_000,
  none: 0,
  unknown: null,
};

/** Upper bound of a band (lower bound for the open-ended top band). Unknown → null. */
function bandNumber(table: Record<string, number | null>, id: string): number | null {
  return id in table ? table[id] : null;
}

function directionTotals(
  values: QuestionnaireValues,
  dir: LeDirection,
  accounts: string[],
  currency: string
): { count: number | null; amount: number | null } {
  let count: number | null = 0;
  let amount: number | null = 0;
  for (const account of accounts) {
    const c = bandNumber(COUNT_MAX, s(values, leCountKey(dir, account, currency)));
    const a = bandNumber(AMOUNT_MAX, s(values, leAmountKey(dir, account, currency)));
    count = count === null || c === null ? null : count + c;
    amount = amount === null || a === null ? null : amount + a;
  }
  return { count, amount };
}

function schedule(values: QuestionnaireValues, pickers: CountryPickers, dir: LeDirection, account: string, currencies: string[]) {
  const active = directionActive(values, dir, account, currencies);
  const countriesUnknown = b(values, leCountriesUnknownKey(dir, account));
  return {
    active,
    countriesUnknown: active ? countriesUnknown : false,
    countries: active && !countriesUnknown ? expand(pickers, leCountriesId(dir, account)) : [],
    purposes: active
      ? flowPurposes(dir, account)
          .filter((p) => b(values, leFlowPurposeKey(dir, account, p.id)))
          .map((p) => p.id)
      : [],
    purposeOther: active && b(values, leFlowPurposeKey(dir, account, "other")) ? s(values, leFlowPurposeOtherKey(dir, account)) : "",
    byCurrency: currencies.map((code) => ({
      currency: code,
      countBand: s(values, leCountKey(dir, account, code)),
      amountBand: s(values, leAmountKey(dir, account, code)),
    })),
  };
}

function ownershipBlock(values: QuestionnaireValues, pickers: CountryPickers) {
  const group = ownershipGroup(values);
  const prefix = personPrefix(group);
  const usePersons = group !== "partnership" || s(values, "le-partner-route") === "percentage";
  const count = usePersons ? rowCount(values, lePersonCountKey(prefix)) : 0;

  const persons: Array<Record<string, unknown>> = [];
  const controlParties: Array<Record<string, unknown>> = [];
  let coverage = 0;

  for (let i = 0; i < count; i += 1) {
    const role = s(values, lePersonKey(prefix, "role", i));
    const pctRaw = Number(s(values, lePersonKey(prefix, "pct", i)));
    const pct = Number.isFinite(pctRaw) && pctRaw > 0 ? pctRaw : null;
    if (pct !== null && (group === "company" || group === "partnership")) coverage += pct;
    const desc = s(values, lePersonKey(prefix, "desc", i));
    const defaultRole = group === "company" ? "beneficial_owner" : group === "partnership" ? "partner" : "controller";
    if (role === "Beneficiary class" || role === "Other control") {
      controlParties.push({ id: `${prefix}-${i}`, role, description: desc });
      continue;
    }
    persons.push({
      id: `${prefix}-${i}`,
      anonymous: true,
      nationalities: expand(pickers, lePersonNatId(prefix, i)),
      residence: s(values, lePersonKey(prefix, "res", i)),
      sharePercentage: pct,
      controlRoles: [role || defaultRole],
    });
  }

  const shareholders: Array<Record<string, unknown>> = [];
  if (group === "company" && s(values, "corporate") === "Yes") {
    const n = rowCount(values, "le-corp-count");
    for (let i = 0; i < n; i += 1) {
      const pctRaw = Number(s(values, leCorpPctKey(i)));
      shareholders.push({
        id: `corp-${i}`,
        anonymous: true,
        jurisdiction: s(values, leCorpJurKey(i)),
        sharePercentage: Number.isFinite(pctRaw) ? pctRaw : null,
      });
    }
  }

  return {
    group,
    persons,
    controlParties,
    shareholders,
    coverage: group === "company" || group === "partnership" ? Math.round(coverage * 100) / 100 : null,
    listed: group === "company" && s(values, "plc-listed") === "Yes" ? s(values, "plc-exchange") : null,
    partnerRoute: group === "partnership" ? s(values, "le-partner-route") : null,
    protector: group === "trust" ? s(values, "le-trust-protector") : null,
    controlDescription:
      group === "nonshare" || (group === "partnership" && s(values, "le-partner-route") === "control")
        ? s(values, "nonshare-structure")
        : "",
  };
}

export function applyLegalEntityBank(
  base: Record<string, unknown>,
  values: QuestionnaireValues,
  pickers: CountryPickers
) {
  const structure = structureByLabel(values["entity-type"]);
  const trust = isTrust(values);
  const ownership = ownershipBlock(values, pickers);
  const notIssued = b(values, "registration-notissued");

  base.applicant = {
    ...(base.applicant as Record<string, unknown>),
    kind: "entity",
    name: s(values, "company-name"),
    jurisdiction: s(values, "incorporation"),
    registration: notIssued ? null : s(values, "registration") || null,
    entityType: structure?.match ?? s(values, "entity-type"),
    legalStructure: structure?.contract ?? null,
    legalStructureLabel: s(values, "entity-type") === "Other" ? s(values, "entity-type-other") || "Other" : s(values, "entity-type"),
    trust: trust
      ? {
          name: s(values, "company-name"),
          governingLaw: s(values, "trust-governing-law"),
          registration: notIssued ? null : s(values, "registration") || null,
        }
      : null,
    personal: null,
    persons: ownership.persons,
    shareholders: ownership.shareholders,
    ownership: {
      group: ownership.group,
      coverage: ownership.coverage,
      listed: ownership.listed,
      partnerRoute: ownership.partnerRoute,
      protector: ownership.protector,
      controlParties: ownership.controlParties,
      controlDescription: ownership.controlDescription,
      anonymous: true,
    },
    group: {
      member: s(values, "group") === "Yes",
      name: s(values, "group") === "Yes" ? s(values, "group-name") : "",
      sameInstitution: "",
    },
  };

  const licensed = licenceActive(values);
  const websiteStatus = s(values, "website-status");
  const officeMode = s(values, "offices");
  base.business = {
    industry: s(values, "industry"),
    otherIndustry: s(values, "industry") === "Other" ? s(values, "industry-other") : "",
    activity: s(values, "activity"),
    website: websiteStatus === "available" ? s(values, "website") : "",
    websiteStatus,
    websiteReason: websiteStatus === "available" ? "" : s(values, "website-reason"),
    permissionRequired: licensed,
    licenceAnswer: licensed ? "Yes" : s(values, "licence"),
    permissions: licensed
      ? [
          {
            name: s(values, "licence-name"),
            number: s(values, "licence-reference"),
            authority: s(values, "licence-authority"),
            jurisdiction: s(values, "licence-jurisdiction"),
            holder: "",
          },
        ]
      : [],
    // Matching engine expects "Yes" only for a physical office in the country of incorporation.
    office: officeMode === "incorporation" ? "Yes" : officeMode ? "No" : "",
    officeMode,
    officeCountries: officeMode === "other" ? expand(pickers, "offices-countries") : [],
    employees: s(values, "employees"),
    euAgent: euAgentApplicable(values) ? s(values, "agent") || null : null,
  };

  const contact = (base.context as { contact: Record<string, unknown> }).contact;
  contact.phone = s(values, "contact-phone") || null;
  (base.context as Record<string, unknown>).existingBanking = existingBanking(values);

  const accounts = selectedAccounts(values);
  const currencies = selectedCurrencies(values);
  const reportCurrency = currencies[0] ?? "";

  const accountCaps = LE_ACCOUNTS.filter((a) => accounts.includes(a.id)).map((a) =>
    req(`bank.capability.${a.id}`, a.id, "essential")
  );
  const purposeCaps = LE_PURPOSES.filter((p) => p.matchLabel && b(values, lePurposeKey(p.id))).flatMap((p) => {
    const id = C.capability("bank", p.matchLabel as string);
    return id ? [req(`bank.capability.${id}`, id, "preferred")] : [];
  });
  const serviceCaps = LE_SERVICES.filter((svc) => b(values, leSvcKey(svc.id))).flatMap((svc) => {
    const id = C.capability("bank", svc.matchLabel);
    return id ? [req(`bank.capability.${id}`, id, priorityOf(values[leSvcLevelKey(svc.id)]))] : [];
  });

  const currencyReqs = (LE_CURRENCIES as readonly string[])
    .filter((c) => b(values, leCurrKey(c)))
    .map((code) => req(`bank.currency.${code}`, code, priorityOf(values[leCurrLevelKey(code)])));

  const rails = LE_RAILS.filter((r) => b(values, leRailKey(r.id))).map((r) => ({
    id: r.id,
    currency: r.currency,
    label: r.fullLabel,
    priority: priorityOf(values[leCurrLevelKey(r.currency)]),
    appliesToAccounts: accounts,
  }));

  const schedules = Object.fromEntries(
    accounts.map((account) => [
      account,
      {
        incoming: schedule(values, pickers, "in", account, currencies),
        outgoing: schedule(values, pickers, "out", account, currencies),
      },
    ])
  );

  const monthly = accounts.flatMap((account) =>
    currencies.map((code) => ({
      account,
      currency: code,
      incoming: { countBand: s(values, leCountKey("in", account, code)), amountBand: s(values, leAmountKey("in", account, code)) },
      outgoing: { countBand: s(values, leCountKey("out", account, code)), amountBand: s(values, leAmountKey("out", account, code)) },
    }))
  );

  const activeIn = accounts.filter((a) => directionActive(values, "in", a, currencies));
  const activeOut = accounts.filter((a) => directionActive(values, "out", a, currencies));
  const inTotals = directionTotals(values, "in", activeIn, reportCurrency);
  const outTotals = directionTotals(values, "out", activeOut, reportCurrency);
  const union = (dir: LeDirection, list: string[]) =>
    [...new Set(list.flatMap((a) => (b(values, leCountriesUnknownKey(dir, a)) ? [] : expand(pickers, leCountriesId(dir, a)))))].sort();

  const requested = accounts.length > 1 ? "both" : accounts[0] === "client_funds" ? "clientFunds" : accounts.length ? "operating" : "";

  (base.requirements as Record<string, unknown>).bank = {
    leVersion: "le-bank-2026-10",
    capabilities: [...accountCaps, ...purposeCaps, ...serviceCaps],
    accounts: {
      requested,
      operating: accounts.includes("operating"),
      clientFunds: accounts.includes("client_funds"),
    },
    otherCapability: [
      b(values, lePurposeKey("other")) ? s(values, "le-purpose-other") : "",
      b(values, lePurposeKey("facility")) ? s(values, "le-facility-text") : "",
    ]
      .filter(Boolean)
      .join("; "),
    purposes: LE_PURPOSES.filter((p) => b(values, lePurposeKey(p.id))).map((p) => p.id),
    currencies: currencyReqs,
    paymentMethods: rails,
    reportCurrency,
    monthly,
    schedules,
    clientFunds: accounts.includes("client_funds") ? schedules.client_funds : null,
    incoming: {
      countries: union("in", activeIn),
      count: activeIn.length ? inTotals.count : 0,
      amount: activeIn.length ? inTotals.amount : 0,
    },
    outgoing: {
      countries: union("out", activeOut),
      count: activeOut.length ? outTotals.count : 0,
      amount: activeOut.length ? outTotals.amount : 0,
    },
    maxTransfer: null,
    balance: null,
  };
}

function existingBanking(values: QuestionnaireValues) {
  const state = s(values, "existing-banking");
  const declared = state === "present" || state === "closed";
  return {
    state: state || null,
    open: state === "present",
    closed: state === "closed",
    bankName: declared ? s(values, "existing-bank-name") || null : null,
    bankCountry: declared ? s(values, "existing-bank-country") || null : null,
  };
}
