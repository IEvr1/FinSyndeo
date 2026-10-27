import {
  PB_CURRENCIES,
  PB_INCOMING_PURPOSES,
  PB_OUTGOING_PURPOSES,
  PB_WEALTH_SOURCES,
  currKey,
  currLevelKey,
  inAmountKey,
  inCountKey,
  inPurposeKey,
  outAmountKey,
  outCountKey,
  outPurposeKey,
  svcKey,
  wealthKey,
} from "./private-banking-config";
import type { CountryPickers, QuestionnaireValues } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true;
}

export type PbValidationResult = {
  message: string;
  fields: Record<string, string>;
  firstField?: string;
};

export function validatePrivateBankingStep(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): string | null {
  const result = validatePrivateBankingFields(step, values, pickers);
  return result?.message ?? null;
}

export function validatePrivateBankingFields(
  step: number,
  values: QuestionnaireValues,
  pickers: CountryPickers
): PbValidationResult | null {
  const fields: Record<string, string> = {};

  if (step === 20) {
    if (!str(values["pb-name"])) fields["pb-name"] = "Please enter your name.";
    if (!str(values["pb-surname"])) fields["pb-surname"] = "Please enter your surname.";
    if (!str(values["pb-email"]) || !/^\S+@\S+\.\S+$/.test(str(values["pb-email"]))) {
      fields["pb-email"] = "Please enter a valid contact email.";
    }
    if (!(pickers["pb-nationality"]?.length ?? 0)) {
      fields["pb-nationality"] = "Please select at least one nationality.";
    }
    if (!str(values["pb-residence"])) fields["pb-residence"] = "Please select your country of residence.";
    if (!(pickers["pb-tax"]?.length ?? 0)) {
      fields["pb-tax"] = "Please select all countries where you are tax resident.";
    }
  }

  if (step === 21) {
    if (bool(values[svcKey("other")]) && !str(values["pb-needs-text"])) {
      fields["pb-needs-text"] = "Please describe the other service you need.";
    }
    if (!str(values["pb-assets"])) fields["pb-assets"] = "Please select your approximate liquid assets.";
    if (values["pb-transfer"] === undefined || values["pb-transfer"] === "") {
      fields["pb-transfer"] = "Please enter the amount you expect to place with the bank.";
    } else {
      const amount = Number(values["pb-transfer"]);
      if (!Number.isFinite(amount) || amount < 0) {
        fields["pb-transfer"] = "Please enter a valid EUR-equivalent placement amount.";
      }
    }
    const anyCurr = PB_CURRENCIES.some((c) => bool(values[currKey(c)]));
    if (!anyCurr) {
      fields["pb-currencies"] = "Select at least one account currency.";
    } else {
      for (const code of PB_CURRENCIES) {
        if (!bool(values[currKey(code)])) continue;
        const level = str(values[currLevelKey(code)]) || "preferred";
        if (level !== "required" && level !== "preferred") {
          fields[`pb-curr-level:${code}`] = `Choose Must-have or Good to have for ${code}.`;
        }
      }
    }
  }

  if (step === 22) {
    if (!str(values["pb-occupation"])) fields["pb-occupation"] = "Please select your current professional status.";
    if (values["pb-occupation"] === "Other" && !str(values["pb-occupation-other"])) {
      fields["pb-occupation-other"] = "Please briefly describe your professional status.";
    }
    const anyWealth = PB_WEALTH_SOURCES.some((s) => bool(values[wealthKey(s.id)]));
    if (!anyWealth) fields["pb-wealth"] = "Please select at least one source of wealth.";
    if (bool(values[wealthKey("other")]) && !str(values["pb-wealth-other-text"])) {
      fields["pb-wealth-other-text"] = "Please describe how your wealth was accumulated.";
    }
  }

  if (step === 23) {
    const own = str(values["pb-own-funds"]);
    if (!own) {
      fields["pb-own-funds"] = "Please indicate whether the initial funds will come from an account in your own name.";
    }
    if (own === "No") {
      if (!str(values["pb-third-party-relationship"])) {
        fields["pb-third-party-relationship"] = "Please select the sender's relationship to you.";
      }
      if (values["pb-third-party-relationship"] === "Other" && !str(values["pb-third-party-relationship-other"])) {
        fields["pb-third-party-relationship-other"] = "Please describe the relationship.";
      }
      if (!str(values["pb-third-party-reason"])) {
        fields["pb-third-party-reason"] = "Please provide a brief reason for third-party funding.";
      }
    }
    if (!(pickers["pb-origin-country"]?.length ?? 0)) {
      fields["pb-origin-country"] =
        "Please select the country or countries from which the initial transfer will be sent.";
    }

    const regular = str(values["pb-regular-transfers"]);
    if (!regular) {
      fields["pb-regular-transfers"] = "Please indicate whether you expect regular incoming or outgoing transfers.";
    }
    if (regular === "Yes") {
      const incomingInactive = bool(values["pb-incoming-none"]);
      const outgoingInactive = bool(values["pb-outgoing-none"]);
      if (incomingInactive && outgoingInactive) {
        fields["pb-transfer-directions"] =
          "Both directions are marked inactive. Choose No for regular transfers, or leave at least one direction active.";
      }
      const selectedCurrencies = PB_CURRENCIES.filter((c) => bool(values[currKey(c)]));

      if (!incomingInactive) {
        if (!(pickers["pb-incoming"]?.length ?? 0)) {
          fields["pb-incoming"] = "Please select incoming countries.";
        }
        for (const code of selectedCurrencies) {
          if (!str(values[inCountKey(code)])) {
            fields[inCountKey(code)] = `Select expected incoming transactions per month for ${code}.`;
          }
          if (!str(values[inAmountKey(code)])) {
            fields[inAmountKey(code)] = `Select expected incoming amount per month for ${code}.`;
          }
        }
        const anyInPurpose = PB_INCOMING_PURPOSES.some((p) => bool(values[inPurposeKey(p.id)]));
        if (!anyInPurpose) fields["pb-in-purposes"] = "Select at least one purpose of incoming transfers.";
        if (bool(values[inPurposeKey("other")]) && !str(values["pb-in-purpose-other"])) {
          fields["pb-in-purpose-other"] = "Please specify the other incoming purpose.";
        }
      }

      if (!outgoingInactive) {
        if (!(pickers["pb-outgoing"]?.length ?? 0)) {
          fields["pb-outgoing"] = "Please select outgoing countries.";
        }
        for (const code of selectedCurrencies) {
          if (!str(values[outCountKey(code)])) {
            fields[outCountKey(code)] = `Select expected outgoing transactions per month for ${code}.`;
          }
          if (!str(values[outAmountKey(code)])) {
            fields[outAmountKey(code)] = `Select expected outgoing amount per month for ${code}.`;
          }
        }
        const anyOutPurpose = PB_OUTGOING_PURPOSES.some((p) => bool(values[outPurposeKey(p.id)]));
        if (!anyOutPurpose) fields["pb-out-purposes"] = "Select at least one purpose of outgoing transfers.";
        if (bool(values[outPurposeKey("other")]) && !str(values["pb-out-purpose-other"])) {
          fields["pb-out-purpose-other"] = "Please specify the other outgoing purpose.";
        }
      }
    }
  }

  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const firstField = keys[0];
  const message =
    keys.length === 1
      ? fields[firstField]
      : `Please complete ${keys.length} required items below. First: ${fields[firstField]}`;
  return { message, fields, firstField };
}
