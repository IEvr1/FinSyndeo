/**
 * Merchant / combined questionnaire validation (MC01–MC23, MB01–MB06).
 */

import { getSelectableCountries } from "@/lib/country-policy";
import { sharesReconcile } from "@/lib/matching/contract/merchant-math";
import { EU } from "@/lib/provider-apply/config";
import {
  CONTACT_CAPACITIES,
  MERCHANT_BANK_ACCOUNT_TYPES,
  MERCHANT_BANK_CURRENCIES,
  MERCHANT_FIND_BANK_KEY,
  MERCHANT_FULFILMENT,
  MERCHANT_HISTORY_STATUS,
  MERCHANT_LICENCE_ANSWERS,
  MERCHANT_OFFICE_STATUS,
  MERCHANT_PRIORITY_LEVELS,
  MERCHANT_RECEIVING_ACCOUNT_ANSWERS,
  MERCHANT_SALES_ROLE,
  MERCHANT_SETTLEMENT_CURRENCIES,
  MERCHANT_SETTLEMENT_TYPE,
  MERCHANT_SHARE_TOLERANCE,
  MERCHANT_WEBSITE_STATUS,
  bankAcctKey,
  bankCurrKey,
  bankCurrLevelKey,
  bankInAmountKey,
  bankInCountKey,
  bankOutAmountKey,
  bankOutCountKey,
  chargebackCountKey,
  chargebackRatioKey,
  chargebackUnavailableKey,
  channelKey,
  formatChargebackMonthLabel,
  isMerchantEntityTypeAllowed,
  isPlatformOther,
  lastSixCompletedMonths,
  marketsKey,
  parseMarkets,
  payPatternKey,
  platformOtherKey,
  receivingRailsForCurrency,
  salesRoleKey,
  settlementCurrencyKey,
  settlementTypeKey,
  type MerchantMarketRow,
} from "./merchant-config";
import type { CountryPickers, QuestionnaireValues } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes" || v === "on";
}

function isFiller(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length === 1) return true;
  if (/^(.)\1+$/i.test(t)) return true;
  const fillers = new Set(["n/a", "na", "none", "test", "asdf", "xxx", "tba", "tbd", ".", "-", "--"]);
  if (fillers.has(t.toLowerCase())) return true;
  return false;
}

function meaningful(text: string): boolean {
  return !isFiller(text);
}

function parseJsonList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function num(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function isWholeNonNegative(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && Number.isInteger(n);
}

/** Basic region → member countries for Italy+Europe style overlap checks (MC08). */
const REGION_COUNTRIES: Record<string, readonly string[]> = {
  "European Union (EU)": EU,
  Europe: EU,
  "Other Europe": [
    "Albania",
    "Andorra",
    "Belarus",
    "Bosnia & Herzegovina",
    "Iceland",
    "Liechtenstein",
    "Moldova",
    "Monaco",
    "Montenegro",
    "North Macedonia",
    "Norway",
    "Russia",
    "San Marino",
    "Serbia",
    "Switzerland",
    "Ukraine",
    "United Kingdom",
    "Vatican City",
  ],
  "United Kingdom": ["United Kingdom"],
  "United States": ["United States"],
  Canada: ["Canada"],
};

const UBO_COVERAGE_TARGET = 75;

type MerchantCorporateShareholder = {
  id: string;
  jurisdiction: string;
  shareholding: string;
};

type MerchantUbo = {
  id: string;
  ownership: string;
  nationalities?: string[];
  residence?: string;
};

type MerchantGoverningRole = {
  id: string;
  role?: string;
  nationalities?: string[];
  residence?: string;
};

export type MerchantValidationResult = {
  message: string;
  fields: Record<string, string>;
  firstField?: string;
};

function result(fields: Record<string, string>): MerchantValidationResult | null {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const firstField = keys[0];
  const message =
    keys.length === 1
      ? fields[firstField]
      : `Please complete ${keys.length} required items below. First: ${fields[firstField]}`;
  return { message, fields, firstField };
}

/** True when the assessment is on the merchant or combined applicant path. */
export function isMerchantRoute(values: QuestionnaireValues): boolean {
  const accountType = str(values["account-type"]);
  return accountType === "merchant" || accountType === "both";
}

/**
 * Active service scope for merchant journeys.
 * Both-at-start and merchant + find-bank Yes produce the same combined scope (MB01/MB02).
 */
export function resolveMerchantServiceScope(values: QuestionnaireValues): "merchant" | "both" {
  const accountType = str(values["account-type"]);
  if (accountType === "both") return "both";
  if (accountType === "merchant" && (str(values[MERCHANT_FIND_BANK_KEY]) === "Yes" || bool(values[MERCHANT_FIND_BANK_KEY]))) {
    return "both";
  }
  return "merchant";
}

export function isCombinedBankMerchant(values: QuestionnaireValues): boolean {
  return resolveMerchantServiceScope(values) === "both";
}

function isPrivateLimitedCompany(entityType: string): boolean {
  return /private limited company/i.test(entityType);
}

function isAssociation(entityType: string): boolean {
  return /^association$/i.test(entityType.trim());
}

function websiteStatusOf(values: QuestionnaireValues): string {
  return str(values["website-status"] || values["merchant-website-status"]);
}

function channelSelected(values: QuestionnaireValues, id: "online" | "pos"): boolean {
  return bool(values[channelKey(id)]) || bool(values[id]);
}

function settleRailKey(railId: string): string {
  return `merchant-receive-rail:${railId}`;
}

function validateEntityStep(values: QuestionnaireValues): MerchantValidationResult | null {
  const fields: Record<string, string> = {};
  if (!str(values["company-name"])) fields["company-name"] = "Please enter the registered entity name.";
  if (!str(values.incorporation)) fields.incorporation = "Please select the incorporation jurisdiction.";
  if (!str(values.registration) && !bool(values["registration-notissued"])) {
    fields.registration = "Please enter the registration identifier or mark the exception.";
  }
  if (bool(values["registration-notissued"]) && !meaningful(str(values["registration-exception-reason"]))) {
    fields["registration-exception-reason"] = "Please explain the identifier exception.";
  }

  const entityType = str(values["entity-type"]);
  if (!entityType) {
    fields["entity-type"] = "Please select the legal entity type.";
  } else if (!isMerchantEntityTypeAllowed(entityType)) {
    fields["entity-type"] =
      "This merchant route currently supports only private limited companies and associations. This draft uses a different legal structure and needs scope review — the recorded type has been preserved.";
  }
  // agent / referral intentionally not required (MC01).
  return result(fields);
}

function validateBusinessStep(values: QuestionnaireValues, pickers: CountryPickers): MerchantValidationResult | null {
  const fields: Record<string, string> = {};

  const websiteStatus = websiteStatusOf(values);
  const allowedStatus = MERCHANT_WEBSITE_STATUS.some((s) => s.value === websiteStatus);
  if (!websiteStatus || !allowedStatus) {
    fields["website-status"] = "Please indicate whether a company website is available.";
  } else if (websiteStatus === "available") {
    const url = str(values.website);
    if (!url || !/^https?:\/\/\S+\.\S+/i.test(url)) {
      fields.website = "Please enter a valid website URL.";
    }
  } else {
    const reason = str(values["website-reason"] || values["website-unavailable-reason"]);
    if (!meaningful(reason)) {
      fields["website-reason"] = "Please briefly explain why a website is under development or not applicable.";
    }
  }

  const industry = str(values.industry);
  if (!industry) {
    fields.industry = "Please select an industry category.";
  } else if (/^other$/i.test(industry) && !meaningful(str(values["industry-other"] || values["industry-other-text"]))) {
    fields["industry-other"] = "Please explain the Other industry category.";
  }

  const summaryConfirmed = values["website-summary-confirmed"] === true;
  const websiteSummary = str(values["website-summary"]);
  const activityOptional =
    websiteStatus === "available" && summaryConfirmed && Boolean(websiteSummary);
  if (!activityOptional && !meaningful(str(values.activity))) {
    fields.activity =
      "Please describe the company's products/services, customers and operating model (blank, single-letter and filler answers are not accepted).";
  }

  const licence = str(values.licence);
  const licenceOk = MERCHANT_LICENCE_ANSWERS.some((a) => a.value === licence);
  if (!licence || !licenceOk) {
    fields.licence = "Please indicate whether a licence or authorisation is required (Yes, No, or Not yet confirmed).";
  } else if (licence === "Yes") {
    if (!str(values["licence-name"])) fields["licence-name"] = "Please enter the licence or authorisation name.";
    if (!str(values["licence-number"])) fields["licence-number"] = "Please enter the licence reference/number.";
    if (!str(values["licence-authority"])) fields["licence-authority"] = "Please enter the issuing authority.";
    if (!str(values["licence-jurisdiction"])) {
      fields["licence-jurisdiction"] = "Please enter the licence jurisdiction.";
    }
  }
  // licence-applicability-reason is never required (MC03).

  const offices = str(values.offices || values["office-status"] || values["merchant-office-status"]);
  if (!MERCHANT_OFFICE_STATUS.some((o) => o.value === offices)) {
    fields.offices = "Please indicate where the company has offices, or that it has no physical offices.";
  } else if (offices === "other_countries") {
    const countries = pickers["operating-countries"] ?? pickers["office-countries"] ?? [];
    if (!countries.length && !str(values["operating-countries"])) {
      fields["operating-countries"] = "Please select other operating countries.";
    }
  }

  if (!str(values.employees)) {
    fields.employees = "Please enter the number of employees.";
  }

  return result(fields);
}

function validatePaymentChannelsStep(
  values: QuestionnaireValues,
  pickers: CountryPickers
): MerchantValidationResult | null {
  const fields: Record<string, string> = {};
  const online = channelSelected(values, "online");
  const pos = channelSelected(values, "pos");
  if (!online && !pos) {
    fields[channelKey("online")] = "Select at least one payment channel: Online payments and/or In-person POS.";
  }

  if (online) {
    const checkoutStatus = str(values["checkout-status"] || values["merchant-checkout-status"]);
    const checkoutUrl = str(values["checkout-url"] || values["payment-website"] || values["merchant-checkout-url"]);
    const sameAsWebsite = bool(values["checkout-same-as-website"]);
    if (!checkoutStatus && !checkoutUrl && !sameAsWebsite) {
      fields["checkout-status"] =
        "For online payments, provide a checkout status or the website/app where customers will pay.";
    } else if (checkoutStatus === "available" || (!checkoutStatus && checkoutUrl)) {
      const url = sameAsWebsite ? str(values.website) : checkoutUrl;
      if (!sameAsWebsite && (!url || !/^https?:\/\/\S+\.\S+/i.test(url))) {
        fields["checkout-url"] = "Please enter a valid checkout URL, or choose Same as company website.";
      }
    }

    const platform = str(values.platform || values["merchant-platform"]);
    if (platform && isPlatformOther(platform) && !meaningful(str(values[platformOtherKey()]))) {
      fields[platformOtherKey()] = "Please specify the Other shop platform.";
    }

    const gateway = str(values.gateway || values["merchant-gateway"] || values["existing-gateway"]);
    if (gateway && !str(values["gateway-keep"] || values["merchant-gateway-keep"])) {
      fields["gateway-keep"] = "Please indicate whether you must keep this gateway.";
    }
  }

  if (pos) {
    const storeDecided = str(values["store-countries-status"]) === "not_yet_decided" || bool(values["store-not-yet-decided"]);
    const storeCountries =
      pickers["store-countries"] ??
      (Array.isArray(values["store-countries"]) ? (values["store-countries"] as string[]) : []);
    const storeText = str(values["store-countries"]);
    if (!storeDecided && !storeCountries.length && storeText.toLowerCase() !== "not yet decided") {
      fields["store-countries"] = "Select physical store countries, or mark Not yet decided.";
    }
  }

  const salesRole = str(values[salesRoleKey()]);
  if (!MERCHANT_SALES_ROLE.some((r) => r.value === salesRole)) {
    fields[salesRoleKey()] = "Please indicate whose sales you will collect payments for.";
  } else if (
    (salesRole === "marketplace" || salesRole === "both") &&
    !meaningful(str(values["sales-model-description"] || values["marketplace-model"]))
  ) {
    fields["sales-model-description"] =
      "Please briefly describe the marketplace/platform model and where sellers are based.";
  }

  const oneOff = bool(values[payPatternKey("one_off")]) || bool(values["pay-one-off"]);
  const recurring = bool(values[payPatternKey("recurring")]) || bool(values["pay-recurring"]);
  if (!oneOff && !recurring) {
    fields[payPatternKey("one_off")] = "Select at least one payment pattern: one-off and/or recurring.";
  }

  const fulfilment = str(values.fulfilment || values["merchant-fulfilment"]);
  if (!MERCHANT_FULFILMENT.some((f) => f.value === fulfilment || f.label === fulfilment)) {
    fields.fulfilment = "Please select the typical time from payment to delivery or service.";
  }

  return result(fields);
}

function regionContainsCountry(regionName: string, countryName: string): boolean {
  const members = REGION_COUNTRIES[regionName];
  if (!members?.length) return false;
  const needle = countryName.toLowerCase();
  return members.some((c) => c.toLowerCase() === needle);
}

function validateMarketOverlap(markets: MerchantMarketRow[], fields: Record<string, string>) {
  const countries = markets.filter((m) => m.kind === "country" && str(m.name));
  const regions = markets.filter((m) => m.kind === "region" && str(m.name));
  for (const country of countries) {
    for (const region of regions) {
      if (regionContainsCountry(str(region.name), str(country.name))) {
        fields[marketsKey] =
          `Market overlap: ${country.name} is already covered by the regional estimate “${region.name}”. Remove the overlap or clarify remaining-region coverage.`;
        return;
      }
    }
  }
}

function validateMarketsStep(values: QuestionnaireValues): MerchantValidationResult | null {
  const fields: Record<string, string> = {};
  const markets = parseMarkets(values);
  if (!markets.length) {
    fields[marketsKey] = "Add at least one customer market (country or region).";
    return result(fields);
  }

  const allowed = new Set(getSelectableCountries("group1").map((c) => c.toLowerCase()));
  const marketShares: number[] = [];

  markets.forEach((market, mi) => {
    const label = str(market.name) || `Market ${mi + 1}`;
    if (!str(market.name)) {
      fields[`${marketsKey}:${market.id || mi}:name`] = `Select a country or region for ${label}.`;
    } else if (market.kind === "country" && !allowed.has(str(market.name).toLowerCase())) {
      fields[`${marketsKey}:${market.id || mi}:name`] =
        `${label} is excluded under the platform processing country policy and cannot be an active market.`;
    }

    const share = num(market.sharePercent);
    if (share === null) {
      fields[`${marketsKey}:${market.id || mi}:share`] = `Enter the share of total monthly processing value for ${label}.`;
    } else {
      marketShares.push(share);
    }

    const methods = market.methods ?? [];
    if (!methods.length) {
      fields[`${marketsKey}:${market.id || mi}:methods`] = `Add at least one payment method for ${label}.`;
    } else {
      const methodShares: number[] = [];
      methods.forEach((method, ji) => {
        const mShare = num(method.sharePercent);
        if (mShare === null) {
          fields[`${marketsKey}:${market.id || mi}:method:${ji}:share`] =
            `Enter the method share within ${label}.`;
        } else {
          methodShares.push(mShare);
        }
        const currencies = method.currencies ?? [];
        if (!currencies.length) {
          fields[`${marketsKey}:${market.id || mi}:method:${ji}:currencies`] =
            `Add at least one processing currency for a method in ${label}.`;
        }
        currencies.forEach((line, ci) => {
          if (line.unknown === true) return;
          const value = num(line.monthlyValue);
          const count = num(line.monthlyCount);
          if (value === null || !(value > 0)) {
            fields[`${marketsKey}:${market.id || mi}:method:${ji}:curr:${ci}:value`] =
              `Enter a positive monthly processing value for ${line.currency || "currency"} in ${label}, or mark Not yet known.`;
          }
          if (count === null || !isWholeNonNegative(count) || count <= 0) {
            fields[`${marketsKey}:${market.id || mi}:method:${ji}:curr:${ci}:count`] =
              `Enter a whole positive monthly transaction count for ${line.currency || "currency"} in ${label}, or mark Not yet known.`;
          }
        });
      });
      if (methodShares.length) {
        const methodTotal = sharesReconcile(methodShares, 100, MERCHANT_SHARE_TOLERANCE);
        if (!methodTotal.ok) {
          fields[`${marketsKey}:${market.id || mi}:method-total`] =
            `Payment-method shares within ${label} must total 100% (±${MERCHANT_SHARE_TOLERANCE}). Currently ${methodTotal.total}%.`;
        }
      }
    }
  });

  if (marketShares.length) {
    const marketTotal = sharesReconcile(marketShares, 100, MERCHANT_SHARE_TOLERANCE);
    if (!marketTotal.ok) {
      fields[`${marketsKey}:total`] =
        `Market shares must total 100% (±${MERCHANT_SHARE_TOLERANCE}). Currently ${marketTotal.total}%.`;
    }
  }

  validateMarketOverlap(markets, fields);
  // merchant-average-ticket / merchant-maximum-ticket are not required (MC11).
  return result(fields);
}

function applicableHistoryMonths(values: QuestionnaireValues): string[] {
  const all = lastSixCompletedMonths();
  const completedRaw = num(values["merchant-history-months"] ?? values["history-months"] ?? values["completed-months"]);
  if (completedRaw === null) return all;
  const completed = Math.max(0, Math.min(6, Math.floor(completedRaw)));
  if (completed === 0) return [];
  return all.slice(0, completed);
}

function validateHistoryStep(values: QuestionnaireValues): MerchantValidationResult | null {
  const fields: Record<string, string> = {};
  const status = str(values["merchant-history-status"] || values.history);
  if (!MERCHANT_HISTORY_STATUS.some((s) => s.value === status)) {
    fields["merchant-history-status"] =
      "Please indicate whether you currently accept cards, previously accepted cards, or have not started.";
    return result(fields);
  }

  if (status === "currently" || status === "previously") {
    const months = num(values["merchant-history-months"] ?? values["history-months"] ?? values["completed-months"]);
    if (months === null || months < 0 || !Number.isInteger(months)) {
      fields["merchant-history-months"] = "Enter the number of completed processing months (0 is allowed for a new launch).";
    } else {
      for (const ym of applicableHistoryMonths(values)) {
        const unavailable = bool(values[chargebackUnavailableKey(ym)]);
        const explanation = str(values[`merchant-cb-unavailable-reason:${ym}`] || values[`${chargebackUnavailableKey(ym)}-reason`]);
        if (unavailable) {
          if (!meaningful(explanation)) {
            fields[`${chargebackUnavailableKey(ym)}-reason`] =
              `Explain why chargeback figures are unavailable for ${formatChargebackMonthLabel(ym)}.`;
          }
          continue;
        }
        const count = num(values[chargebackCountKey(ym)]);
        const ratio = num(values[chargebackRatioKey(ym)]);
        if (count === null || !isWholeNonNegative(count)) {
          fields[chargebackCountKey(ym)] =
            `Enter the number of chargebacks for ${formatChargebackMonthLabel(ym)}, or mark unavailable with an explanation.`;
        }
        if (ratio === null || ratio < 0) {
          fields[chargebackRatioKey(ym)] =
            `Enter the chargeback-to-sales ratio (%) for ${formatChargebackMonthLabel(ym)}, or mark unavailable with an explanation.`;
        }
      }
    }
  }
  // Statement availability and current provider remain optional (MC12).
  return result(fields);
}

function validatePricingStep(_values: QuestionnaireValues): MerchantValidationResult | null {
  // Target rate and future methods are optional (MC14).
  return null;
}

function validateSettlementStep(values: QuestionnaireValues): MerchantValidationResult | null {
  const fields: Record<string, string> = {};
  const settlementType = str(values[settlementTypeKey()] || values["settlement-type"] || values.settlement);
  if (!MERCHANT_SETTLEMENT_TYPE.some((t) => t.value === settlementType)) {
    fields[settlementTypeKey()] = "Please select settlement type: Bank transfer, Crypto settlement, or Both.";
  }

  const ack =
    values["merchant-settlement-own-name"] === true ||
    values["settlement-own-name-ack"] === true ||
    values["settlement-own-name"] === true;
  if (!ack) {
    fields["merchant-settlement-own-name"] =
      "Please acknowledge that settlement must be paid to an account in the applicant entity’s own legal name.";
  }

  if (settlementType === "bank" || settlementType === "both") {
    const receiving = str(values["merchant-receiving-account"] || values["receiving-account"]);
    if (!MERCHANT_RECEIVING_ACCOUNT_ANSWERS.some((a) => a.value === receiving)) {
      fields["merchant-receiving-account"] =
        "Please indicate whether you have a receiving account in the entity’s own name (Yes, No, or Not yet confirmed).";
    } else if (receiving === "Yes") {
      const selectedCurrencies = MERCHANT_SETTLEMENT_CURRENCIES.filter(
        (c) => bool(values[settlementCurrencyKey(c)]) || bool(values[`settle-curr:${c}`])
      );
      const currencies =
        selectedCurrencies.length > 0
          ? selectedCurrencies
          : MERCHANT_SETTLEMENT_CURRENCIES.filter((c) => bool(values[`settle-${c}`]));
      const active = currencies.length ? currencies : [...MERCHANT_SETTLEMENT_CURRENCIES];
      // If no settlement currency toggles are present, still require at least one rail overall when Yes.
      let anyRail = false;
      for (const code of active) {
        const rails = receivingRailsForCurrency(code);
        const hasRail =
          rails.some((r) => bool(values[settleRailKey(r.id)]) || bool(values[`merchant-rail:${r.id}`])) ||
          bool(values[`merchant-receive-not-sure:${code}`]);
        if (hasRail) anyRail = true;
        if (currencies.length && !hasRail) {
          fields[`merchant-receive-rails:${code}`] =
            `Select at least one receiving rail for ${code}, or mark Not sure.`;
        }
      }
      if (!currencies.length && !anyRail) {
        const eurRails = receivingRailsForCurrency("EUR");
        const gbpRails = receivingRailsForCurrency("GBP");
        const usdRails = receivingRailsForCurrency("USD");
        const named =
          [...eurRails, ...gbpRails, ...usdRails].some((r) => bool(values[settleRailKey(r.id)])) ||
          MERCHANT_SETTLEMENT_CURRENCIES.some((c) => bool(values[`merchant-receive-not-sure:${c}`]));
        if (!named) {
          fields["merchant-receive-rails"] =
            "Select at least one receiving rail for each settlement currency you need, or mark Not sure.";
        }
      }
    }
  }
  // Account-holder legal name, IBAN and bank country are not required (MC16).
  // find-bank remains an optional toggle (MB02).
  return result(fields);
}

function validateBankRequirementsStep(
  values: QuestionnaireValues,
  _pickers: CountryPickers
): MerchantValidationResult | null {
  if (!isCombinedBankMerchant(values)) return null;

  const fields: Record<string, string> = {};
  const selectedAccounts = MERCHANT_BANK_ACCOUNT_TYPES.filter((a) => bool(values[bankAcctKey(a.id)]));
  if (!selectedAccounts.length) {
    fields[bankAcctKey("operating")] =
      "Select at least one account type: operating/commercial and/or dedicated client-funds.";
  }
  // client_funds is never auto-required (MC17 / MB03).

  const selectedCurrencies = MERCHANT_BANK_CURRENCIES.filter((c) => bool(values[bankCurrKey(c)]));
  if (!selectedCurrencies.length) {
    fields[bankCurrKey("EUR")] = "Select at least one account currency (EUR, GBP or USD).";
  } else {
    for (const code of selectedCurrencies) {
      const level = str(values[bankCurrLevelKey(code)]);
      if (!MERCHANT_PRIORITY_LEVELS.some((l) => l.value === level)) {
        fields[bankCurrLevelKey(code)] = `Choose Must-have or Good to have for ${code}.`;
      }
    }
  }

  for (const account of selectedAccounts) {
    for (const code of selectedCurrencies) {
      const inCount = str(values[bankInCountKey(account.id, code)]);
      const inAmount = str(values[bankInAmountKey(account.id, code)]);
      const outCount = str(values[bankOutCountKey(account.id, code)]);
      const outAmount = str(values[bankOutAmountKey(account.id, code)]);
      if (!inCount) {
        fields[bankInCountKey(account.id, code)] =
          `${account.label} ${code} incoming: select a monthly transaction count band (No activity / Not yet known allowed).`;
      }
      if (!inAmount) {
        fields[bankInAmountKey(account.id, code)] =
          `${account.label} ${code} incoming: select a monthly amount band (No activity / Not yet known allowed).`;
      }
      if (!outCount) {
        fields[bankOutCountKey(account.id, code)] =
          `${account.label} ${code} outgoing: select a monthly transaction count band (No activity / Not yet known allowed).`;
      }
      if (!outAmount) {
        fields[bankOutAmountKey(account.id, code)] =
          `${account.label} ${code} outgoing: select a monthly amount band (No activity / Not yet known allowed).`;
      }
    }
  }

  return result(fields);
}

function validateOwnershipStep(values: QuestionnaireValues, pickers: CountryPickers): MerchantValidationResult | null {
  const fields: Record<string, string> = {};
  const entityType = str(values["entity-type"]);
  const association = isAssociation(entityType);
  const privateCo = isPrivateLimitedCompany(entityType) || (!association && isMerchantEntityTypeAllowed(entityType));

  if (privateCo && !association) {
    const corporate = str(values.corporate);
    if (corporate !== "Yes" && corporate !== "No") {
      fields.corporate = "Please indicate whether any shareholders are legal entities.";
    }
    if (corporate === "Yes") {
      const corps = parseJsonList<MerchantCorporateShareholder>(
        values["merchant-corporate-shareholders"] || values["co-corporate-shareholders"]
      );
      if (!corps.length) {
        fields["merchant-corporate-shareholders"] = "Add at least one corporate shareholder jurisdiction and %, or answer No.";
      }
      let corpTotal = 0;
      for (const row of corps) {
        if (!str(row.jurisdiction)) {
          fields[`merchant-corp-${row.id}-jurisdiction`] =
            "Enter incorporation jurisdiction for each corporate shareholder (names are not required).";
        }
        const pct = Number(row.shareholding);
        if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
          fields[`merchant-corp-${row.id}-pct`] = "Shareholding in the applicant company (%) must be a number up to 100.";
        } else {
          corpTotal += pct;
        }
      }
      if (corpTotal > 100) {
        fields["merchant-corporate-shareholders"] = "Corporate shareholding percentages cannot exceed 100% in total.";
      }
    }

    const ubos = parseJsonList<MerchantUbo>(values["merchant-ubos"] || values["co-ubos"]);
    if (!ubos.length) {
      fields["merchant-ubos"] = "Add at least one natural-person beneficial owner (nationality, residence and %).";
    }
    let uboTotal = 0;
    for (const ubo of ubos) {
      const pct = Number(ubo.ownership);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        fields[`merchant-ubo-${ubo.id}-pct`] =
          "Beneficial ownership of the applicant company (%) must be a number up to 100.";
      } else {
        uboTotal += pct;
      }
      const nats =
        ubo.nationalities?.length ??
        pickers[`merchant-ubo-nat-${ubo.id}`]?.length ??
        pickers[`co-ubo-nat-${ubo.id}`]?.length ??
        0;
      if (!nats) {
        fields[`merchant-ubo-${ubo.id}-nat`] = "Select nationality or nationalities for each beneficial owner.";
      }
      const residence =
        str(ubo.residence) ||
        str(values[`merchant-ubo-res-${ubo.id}`]) ||
        str(values[`co-ubo-res-${ubo.id}`]);
      if (!residence && !(pickers[`merchant-ubo-res-${ubo.id}`]?.length || pickers[`co-ubo-res-${ubo.id}`]?.length)) {
        fields[`merchant-ubo-${ubo.id}-res`] = "Select country of residence for each beneficial owner.";
      }
    }
    if (uboTotal > 100) {
      fields["merchant-ubos"] = "Beneficial ownership percentages cannot exceed 100% in total.";
    }
    if (uboTotal < UBO_COVERAGE_TARGET && !meaningful(str(values["ownership-clarification"]))) {
      fields["ownership-clarification"] =
        `Beneficial ownership coverage is below the ${UBO_COVERAGE_TARGET}% initial assessment target. Provide an unresolved-control note, or add further owners.`;
    }
  }

  if (association) {
    const roles = parseJsonList<MerchantGoverningRole>(values["merchant-governing-roles"]);
    if (!roles.length) {
      fields["merchant-governing-roles"] =
        "Add governing committee/board or senior managing roles with nationality and residence (no shareholder percentages).";
    }
    for (const role of roles) {
      const nats = role.nationalities?.length ?? pickers[`merchant-role-nat-${role.id}`]?.length ?? 0;
      if (!nats) {
        fields[`merchant-role-${role.id}-nat`] = "Select nationality or nationalities for each governing role.";
      }
      const residence = str(role.residence) || str(values[`merchant-role-res-${role.id}`]);
      if (!residence && !(pickers[`merchant-role-res-${role.id}`]?.length)) {
        fields[`merchant-role-${role.id}-res`] = "Select country of residence for each governing role.";
      }
    }
  }

  const group = str(values.group);
  if (group !== "Yes" && group !== "No") {
    fields.group = "Please indicate whether the entity is part of a group.";
  }
  // When group is No, inactive group fields are not required (MC19).

  return result(fields);
}

function validateContactStep(values: QuestionnaireValues): MerchantValidationResult | null {
  const fields: Record<string, string> = {};
  if (!str(values["contact-name"])) fields["contact-name"] = "Please enter the contact name.";
  const email = str(values["contact-email"]);
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    fields["contact-email"] = "Please enter a valid contact email.";
  }

  const capacity = str(values["representative-role"] || values["contact-capacity"]);
  if (!capacity || !(CONTACT_CAPACITIES as readonly string[]).includes(capacity)) {
    fields["representative-role"] = "Please select your capacity in relation to the entity.";
  } else if (
    capacity === "Other" &&
    !meaningful(str(values["representative-role-other"] || values["contact-capacity-other"]))
  ) {
    fields["representative-role-other"] = "Please describe your capacity.";
  }

  if (values["representative-authority"] !== true) {
    fields["representative-authority"] = "Please confirm your authority to submit for the entity.";
  }
  // Phone is not mandatory (MC20).
  return result(fields);
}

export function validateMerchantFields(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): MerchantValidationResult | null {
  if (step === 1) return validateEntityStep(values);
  if (step === 2) return validateBusinessStep(values, pickers);
  if (step === 3) return validateBankRequirementsStep(values, pickers);
  if (step === 4) return validateOwnershipStep(values, pickers);
  if (step === 5) return validateContactStep(values);
  if (step === 7) return validatePaymentChannelsStep(values, pickers);
  if (step === 8) return validateMarketsStep(values);
  if (step === 9) return validateHistoryStep(values);
  if (step === 10) return validatePricingStep(values);
  if (step === 11) return validateSettlementStep(values);
  return null;
}

export function validateMerchantStep(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): string | null {
  return validateMerchantFields(step, values, pickers)?.message ?? null;
}

/** Active bank account types for combined summaries (client_funds only when explicitly selected). */
export function activeMerchantBankAccounts(values: QuestionnaireValues): Array<{ id: string; label: string }> {
  if (!isCombinedBankMerchant(values)) return [];
  return MERCHANT_BANK_ACCOUNT_TYPES.filter((a) => bool(values[bankAcctKey(a.id)])).map((a) => ({
    id: a.id,
    label: a.label,
  }));
}

export function activeMerchantBankCurrencies(values: QuestionnaireValues): string[] {
  if (!isCombinedBankMerchant(values)) return [];
  return MERCHANT_BANK_CURRENCIES.filter((c) => bool(values[bankCurrKey(c)]));
}

/** Exposed for UI overlap hints; mirrors the basic REGION_COUNTRIES map used in validation. */
export function merchantRegionCountries(regionName: string): readonly string[] {
  return REGION_COUNTRIES[regionName] ?? [];
}
