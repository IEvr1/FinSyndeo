import {
  PB_CURRENCIES,
  PB_SERVICES,
  PB_WEALTH_SOURCES,
  PB_FUND_SOURCES,
  PB_TRANSFER_PURPOSES,
  svcKey,
  wealthKey,
  fundKey,
  purposeKey,
} from "./private-banking-config";
import type { CountryPickers, QuestionnaireValues } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true;
}

export function validatePrivateBankingStep(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): string | null {
  if (step === 20) {
    if (!str(values["pb-name"])) return "Please enter your name.";
    if (!str(values["pb-surname"])) return "Please enter your surname.";
    if (!str(values["pb-email"]) || !/^\S+@\S+\.\S+$/.test(str(values["pb-email"]))) {
      return "Please enter a valid contact email.";
    }
    if (!(pickers["pb-nationality"]?.length ?? 0)) return "Please select at least one nationality.";
    if (!str(values["pb-residence"])) return "Please select your country of residence.";
    if (!(pickers["pb-tax"]?.length ?? 0)) return "Please select all countries where you are tax resident.";
    return null;
  }

  if (step === 21) {
    const anySvc = PB_SERVICES.some((s) => bool(values[svcKey(s.id)]));
    if (!anySvc) return "Please select at least one service you would like the bank to provide.";
    if (bool(values[svcKey("other")]) && !str(values["pb-needs-text"])) {
      return "Please describe the other service you need.";
    }
    if (!str(values["pb-assets"])) return "Please select your approximate liquid assets.";
    if (values["pb-transfer"] === undefined || values["pb-transfer"] === "") {
      return "Please enter the amount you expect to place with the bank.";
    }
    const amount = Number(values["pb-transfer"]);
    if (!Number.isFinite(amount) || amount < 0) return "Please enter a valid placement amount.";
    const anyCurr = PB_CURRENCIES.some((c) => bool(values[`pb-curr:${c}`]));
    if (!anyCurr) return "Please select at least one account currency.";
    if (bool(values["pb-curr:Other"]) && !str(values["pb-currencies-text"])) {
      return "Please specify other currencies.";
    }
    if (bool(values["pb-current-bank-details"]) || values["pb-current-bank"] === "Yes") {
      if (values["pb-current-bank"] === "Yes" && !str(values["pb-current-bank-name"]) && !str(values["pb-current-bank-country"])) {
        /* optional bank name/country */
      }
    }
    return null;
  }

  if (step === 22) {
    if (!str(values["pb-occupation"])) return "Please select your current professional status.";
    if (values["pb-occupation"] === "Other" && !str(values["pb-occupation-other"])) {
      return "Please briefly describe your professional status.";
    }
    const anyWealth = PB_WEALTH_SOURCES.some((s) => bool(values[wealthKey(s.id)]));
    if (!anyWealth) return "Please select at least one source of wealth.";
    if (bool(values[wealthKey("other")]) && !str(values["pb-wealth-other-text"])) {
      return "Please describe how your wealth was accumulated.";
    }
    const anyFund = PB_FUND_SOURCES.some((s) => bool(values[fundKey(s.id)]));
    if (!anyFund) return "Please select the source of the money you intend to place with the bank.";
    if (bool(values[fundKey("other")]) && !str(values["pb-fund-other-text"])) {
      return "Please describe the source of the proposed funds.";
    }
    if (
      bool(values[fundKey("existing_savings")]) &&
      !PB_WEALTH_SOURCES.some((s) => bool(values[`pb-fund-origin:${s.id}`]))
    ) {
      return "Please indicate the original source of your existing savings or investments.";
    }
    return null;
  }

  if (step === 23) {
    if (!(pickers["pb-origin-country"]?.length ?? 0)) {
      return "Please select the country or countries from which the initial transfer will be sent.";
    }
    const own = str(values["pb-own-funds"]);
    if (!own) return "Please indicate whether the initial funds will come from an account in your own name.";
    if (own === "No") {
      if (!str(values["pb-third-party-name"])) return "Please enter the sender's name.";
      if (!str(values["pb-third-party-relationship"])) return "Please describe the sender's relationship to you.";
      if (!str(values["pb-third-party-reason"])) return "Please provide a brief reason for third-party funding.";
    }
    const regular = str(values["pb-regular-transfers"]);
    if (!regular) return "Please indicate whether you expect regular incoming or outgoing transfers.";
    if (regular === "Yes") {
      const dir = str(values["pb-transfer-direction"]);
      if (!dir) return "Please select incoming, outgoing or both.";
      if (dir === "Incoming" || dir === "Both") {
        if (!(pickers["pb-incoming"]?.length ?? 0)) return "Please select incoming countries.";
        if (!str(values["pb-in-count"]) || !str(values["pb-in-amount"])) {
          return "Please enter expected incoming transactions and amount per month.";
        }
      }
      if (dir === "Outgoing" || dir === "Both") {
        if (!(pickers["pb-outgoing"]?.length ?? 0)) return "Please select outgoing countries.";
        if (!str(values["pb-out-count"]) || !str(values["pb-out-amount"])) {
          return "Please enter expected outgoing transactions and amount per month.";
        }
      }
      if (!str(values["pb-report-currency"])) return "Please select the reporting currency for monthly amounts.";
      const anyPurpose = PB_TRANSFER_PURPOSES.some((p) => bool(values[purposeKey(p)]));
      if (!anyPurpose) return "Please select at least one purpose of regular transfers.";
      if (bool(values[purposeKey("Other")]) && !str(values["pb-purpose-other"])) {
        return "Please specify the other purpose of regular transfers.";
      }
    }
    return null;
  }

  return null;
}
