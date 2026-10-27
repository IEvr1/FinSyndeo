"use client";

import type { ReactNode } from "react";
import { APPLICANT_ONBOARDING_METHODS, onboardingStorageKey } from "@/lib/onboarding-methods";
import {
  LE_ACCOUNTS,
  LE_AMOUNT_BANDS,
  LE_BANK_STEP_LABELS,
  LE_COUNT_BANDS,
  LE_EXISTING_BANKING,
  LE_OFFICE_MODES,
  LE_PARTNER_ROUTES,
  LE_PURPOSES,
  LE_SERVICES,
  LE_WEBSITE_STATUS,
  accountLabel,
  bandLabel,
  directionActive,
  euAgentApplicable,
  flowPurposes,
  isPublicCompany,
  isTrust,
  leAcctKey,
  leAmountKey,
  leCorpJurKey,
  leCorpPctKey,
  leCountKey,
  leCountriesId,
  leCountriesUnknownKey,
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
  levelLabel,
  ownershipGroup,
  personPrefix,
  railsForCurrency,
  rowCount,
  selectedAccounts,
  selectedCurrencies,
  type LeDirection,
} from "@/lib/questionnaire/legal-entity-bank-config";
import type { CountryPickers, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onEdit: (step: number) => void;
};

function SummaryCard({ title, step, onEdit, children }: { title: string; step: number; onEdit: (s: number) => void; children: ReactNode }) {
  return (
    <section className="panel summary-card" data-summary-step={step}>
      <header className="flex justify-between items-center gap-3 mb-3">
        <h2 className="mt-0">{title}</h2>
        <button type="button" className="mini" onClick={() => onEdit(step)}>
          Edit
        </button>
      </header>
      <dl className="summary">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="summary-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

export function LegalEntityBankSummary({ values, pickers, onEdit }: Props) {
  const trust = isTrust(values);
  const group = ownershipGroup(values);
  const prefix = personPrefix(group);
  const accounts = selectedAccounts(values);
  const currencies = selectedCurrencies(values);
  const both = accounts.length > 1;

  const websiteStatus = LE_WEBSITE_STATUS.find((s) => s.value === str(values["website-status"]));
  const officeMode = LE_OFFICE_MODES.find((m) => m.value === str(values.offices));

  const purposes = LE_PURPOSES.filter((p) => values[lePurposeKey(p.id)] === true)
    .map((p) => (p.id === "other" && str(values["le-purpose-other"]) ? `Other: ${str(values["le-purpose-other"])}` : p.label))
    .join("; ");
  const services = LE_SERVICES.filter((s) => values[leSvcKey(s.id)] === true)
    .map((s) => `${s.label} (${levelLabel(values[leSvcLevelKey(s.id)])})`)
    .join("; ");
  const currencyText = currencies.map((c) => `${c} (${levelLabel(values[leCurrLevelKey(c)])})`).join(", ");

  function flowText(dir: LeDirection, account: string): string {
    if (!directionActive(values, dir, account, currencies)) return "No activity expected";
    const estimates = currencies
      .map((c) => {
        const count = bandLabel(LE_COUNT_BANDS, str(values[leCountKey(dir, account, c)]));
        const amount = bandLabel(LE_AMOUNT_BANDS, str(values[leAmountKey(dir, account, c)]));
        return `${c}: ${count || "—"} payments / ${amount || "—"}`;
      })
      .join("; ");
    const countries = values[leCountriesUnknownKey(dir, account)] === true
      ? "Countries not yet known"
      : (pickers[leCountriesId(dir, account)] ?? []).join(", ");
    const purposeLabels = flowPurposes(dir, account)
      .filter((p) => values[leFlowPurposeKey(dir, account, p.id)] === true)
      .map((p) =>
        p.id === "other" && str(values[leFlowPurposeOtherKey(dir, account)])
          ? `Other: ${str(values[leFlowPurposeOtherKey(dir, account)])}`
          : p.label
      )
      .join("; ");
    return [estimates, countries, purposeLabels].filter(Boolean).join(" · ");
  }

  const existing = LE_EXISTING_BANKING.find((o) => o.value === str(values["existing-banking"]));
  const existingState = str(values["existing-banking"]);

  const personCount = rowCount(values, lePersonCountKey(prefix));
  const personRows: Array<{ label: string; value: string }> = [];
  for (let i = 0; i < personCount; i += 1) {
    const role = str(values[lePersonKey(prefix, "role", i)]);
    const pctValue = str(values[lePersonKey(prefix, "pct", i)]);
    const nats = (pickers[lePersonNatId(prefix, i)] ?? []).join(", ");
    const res = str(values[lePersonKey(prefix, "res", i)]);
    const desc = str(values[lePersonKey(prefix, "desc", i)]);
    const parts = [
      role,
      pctValue ? `${pctValue}%` : "",
      desc,
      nats ? `Nationality: ${nats}` : "",
      res ? `Resident in ${res}` : "",
    ].filter(Boolean);
    personRows.push({
      label:
        group === "company"
          ? `Beneficial owner ${i + 1}`
          : group === "partnership"
            ? `Partner ${i + 1}`
            : group === "trust"
              ? `Trust party ${i + 1}`
              : `Role holder ${i + 1}`,
      value: parts.join(" · "),
    });
  }

  const corpCount = group === "company" && values.corporate === "Yes" ? rowCount(values, "le-corp-count") : 0;

  const onboarding = values["onboarding-no-preference"] === true
    ? "No preference"
    : APPLICANT_ONBOARDING_METHODS.filter((m) => m !== "No preference" && !m.startsWith("Other") && values[onboardingStorageKey(m)] === true).join("; ");

  return (
    <>
      <SummaryCard title={LE_BANK_STEP_LABELS[1]} step={1} onEdit={onEdit}>
        <Row label="Legal structure" value={str(values["entity-type"]) === "Other" ? `Other: ${str(values["entity-type-other"])}` : str(values["entity-type"])} />
        <Row label={trust ? "Trust name" : "Registered name"} value={str(values["company-name"])} />
        <Row label={trust ? "Established in" : "Incorporated in"} value={str(values.incorporation)} />
        {trust && <Row label="Governing law" value={str(values["trust-governing-law"])} />}
        <Row
          label={trust ? "Trust registration / reference" : "Registration number"}
          value={values["registration-notissued"] === true ? (trust ? "Not applicable" : `Not issued — ${str(values["registration-exception-reason"])}`) : str(values.registration)}
        />
      </SummaryCard>

      <SummaryCard title={LE_BANK_STEP_LABELS[2]} step={2} onEdit={onEdit}>
        <Row label="Website" value={websiteStatus?.value === "available" ? str(values.website) : `${websiteStatus?.label ?? ""}${str(values["website-reason"]) ? ` — ${str(values["website-reason"])}` : ""}`} />
        <Row label="Industry" value={str(values.industry) === "Other" ? `Other: ${str(values["industry-other"])}` : str(values.industry)} />
        <Row label="Activity" value={str(values.activity)} />
        {licenceActive(values) ? (
          <>
            <Row label="Licence" value={str(values["licence-name"])} />
            <Row label="Licence reference" value={str(values["licence-reference"])} />
            <Row label="Issuing authority" value={str(values["licence-authority"])} />
            <Row label="Licensing jurisdiction" value={str(values["licence-jurisdiction"])} />
          </>
        ) : (
          <Row label="Licence required" value={str(values.licence)} />
        )}
        {euAgentApplicable(values) && <Row label="EU payment agent" value={str(values.agent)} />}
        <Row label={trust ? "Administered / operated" : "Physical offices"} value={officeMode ? (trust ? officeMode.trustLabel : officeMode.label) : ""} />
        {str(values.offices) === "other" && <Row label="Office countries" value={(pickers["offices-countries"] ?? []).join(", ")} />}
        <Row label="Employees" value={str(values.employees)} />
      </SummaryCard>

      <SummaryCard title={LE_BANK_STEP_LABELS[3]} step={3} onEdit={onEdit}>
        <Row label="Account types" value={LE_ACCOUNTS.filter((a) => values[leAcctKey(a.id)] === true).map((a) => a.label).join("; ")} />
        <Row label="Purposes" value={purposes} />
        {values[lePurposeKey("facility")] === true && <Row label="Facility needed" value={str(values["le-facility-text"])} />}
        <Row label="Additional services" value={services} />
        <Row label="Currencies" value={currencyText} />
        <Row
          label={both ? "Payment methods (all selected accounts)" : "Payment methods"}
          value={currencies
            .flatMap((c) => railsForCurrency(c).filter((r) => values[leRailKey(r.id)] === true).map((r) => `${c} ${r.label}`))
            .join("; ")}
        />
        {accounts.map((account) => (
          <div key={account} className="contents">
            <Row label={`${accountLabel(account)} — incoming`} value={flowText("in", account)} />
            <Row label={`${accountLabel(account)} — outgoing`} value={flowText("out", account)} />
          </div>
        ))}
      </SummaryCard>

      <SummaryCard title={LE_BANK_STEP_LABELS[39]} step={39} onEdit={onEdit}>
        <Row label="Existing business banking" value={existing?.label ?? ""} />
        {(existingState === "present" || existingState === "closed") && (
          <>
            <Row label={existingState === "closed" ? "Closed account bank" : "Bank"} value={str(values["existing-bank-name"])} />
            <Row label="Bank country" value={str(values["existing-bank-country"])} />
          </>
        )}
      </SummaryCard>

      <SummaryCard title={LE_BANK_STEP_LABELS[4]} step={4} onEdit={onEdit}>
        {group === "company" && isPublicCompany(values) && (
          <>
            <Row label="Listed on a stock exchange" value={str(values["plc-listed"])} />
            {values["plc-listed"] === "Yes" && <Row label="Exchange / ticker" value={str(values["plc-exchange"])} />}
          </>
        )}
        {group === "company" && <Row label="Corporate shareholders" value={str(values.corporate)} />}
        {Array.from({ length: corpCount }, (_, i) => (
          <Row
            key={`corp-${i}`}
            label={`Corporate shareholder ${i + 1}`}
            value={[str(values[leCorpJurKey(i)]), str(values[leCorpPctKey(i)]) ? `${str(values[leCorpPctKey(i)])}%` : ""].filter(Boolean).join(" · ")}
          />
        ))}
        {group === "partnership" && (
          <Row label="Partner route" value={LE_PARTNER_ROUTES.find((r) => r.value === str(values["le-partner-route"]))?.label ?? ""} />
        )}
        {(group !== "partnership" || values["le-partner-route"] === "percentage") &&
          personRows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
        {group === "trust" && <Row label="Protector" value={str(values["le-trust-protector"])} />}
        {(group === "nonshare" || (group === "partnership" && values["le-partner-route"] === "control")) && (
          <Row label="Control" value={str(values["nonshare-structure"])} />
        )}
        {group === "company" && <Row label="Clarification" value={str(values["ownership-clarification"])} />}
        <Row label="Group member" value={str(values.group)} />
        {values.group === "Yes" && <Row label="Group name" value={str(values["group-name"])} />}
      </SummaryCard>

      <SummaryCard title={LE_BANK_STEP_LABELS[5]} step={5} onEdit={onEdit}>
        <Row label="Contact name" value={str(values["contact-name"])} />
        <Row label="Contact email" value={str(values["contact-email"])} />
        <Row label="Phone" value={str(values["contact-phone"])} />
        <Row label="Capacity" value={str(values["representative-role"])} />
        <Row label="Firm" value={str(values["representative-firm"])} />
        <Row label="Authorised to apply" value={values["representative-authority"] === true ? "Confirmed" : ""} />
        <Row label="Onboarding" value={onboarding} />
        <Row label="Relationship-manager language" value={str(values["relationship-manager-language"])} />
      </SummaryCard>
    </>
  );
}
