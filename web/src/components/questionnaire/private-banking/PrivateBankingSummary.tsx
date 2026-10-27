"use client";

import type { ReactNode } from "react";
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
  wealthKey,
} from "@/lib/questionnaire/private-banking-config";
import type { CountryPickers, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onEdit: (step: number) => void;
};

function fmtMoney(amount: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount || "Not specified";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(n);
}

function SummaryCard({ title, step, onEdit, children }: { title: string; step: number; onEdit: (s: number) => void; children: ReactNode }) {
  return (
    <section className="panel summary-card">
      <header className="flex justify-between items-center gap-3 mb-3">
        <h2 className="mt-0">{title}</h2>
        <button type="button" className="mini" onClick={() => onEdit(step)}>Edit</button>
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

function levelLabel(v: unknown) {
  return v === "required" ? "Must-have" : "Good to have";
}

export function PrivateBankingSummary({ values, pickers, onEdit }: Props) {
  const own = String(values["pb-own-funds"] ?? "");
  const showThirdParty = own === "No";
  const regular = String(values["pb-regular-transfers"] ?? "");
  const incomingInactive = values["pb-incoming-none"] === true;
  const outgoingInactive = values["pb-outgoing-none"] === true;
  const selectedCurrencies = PB_CURRENCIES.filter((c) => values[currKey(c)] === true);

  const extras = PB_SERVICES
    .filter((s) => values[svcKey(s.id)] === true)
    .map((s) => `${s.label} (${levelLabel(values[`pb-svc-level:${s.id}`])})`)
    .join("; ");

  const currencies = selectedCurrencies
    .map((c) => `${c} (${levelLabel(values[currLevelKey(c)])})`)
    .join(", ");

  const rails = PB_PAYMENT_ROUTES
    .filter((r) => values[railKey(r.id)] === true)
    .map((r) => r.label)
    .join("; ");

  const wealth = PB_WEALTH_SOURCES.filter((s) => values[wealthKey(s.id)] === true).map((s) => s.label).join("; ");

  const inPurposes = PB_INCOMING_PURPOSES.filter((p) => values[inPurposeKey(p.id)] === true)
    .map((p) => p.label)
    .join("; ");
  const outPurposes = PB_OUTGOING_PURPOSES.filter((p) => values[outPurposeKey(p.id)] === true)
    .map((p) => p.label)
    .join("; ");

  const inEstimates = selectedCurrencies
    .map((c) => {
      const count = values[inCountKey(c)];
      const amount = values[inAmountKey(c)];
      if (!count && !amount) return "";
      return `${c}: ${count || "—"} / ${amount || "—"}`;
    })
    .filter(Boolean)
    .join("; ");

  const outEstimates = selectedCurrencies
    .map((c) => {
      const count = values[outCountKey(c)];
      const amount = values[outAmountKey(c)];
      if (!count && !amount) return "";
      return `${c}: ${count || "—"} / ${amount || "—"}`;
    })
    .filter(Boolean)
    .join("; ");

  return (
    <>
      <SummaryCard title="Personal details" step={20} onEdit={onEdit}>
        <Row label="Name" value={String(values["pb-name"] ?? "")} />
        <Row label="Surname" value={String(values["pb-surname"] ?? "")} />
        <Row label="Contact email" value={String(values["pb-email"] ?? "")} />
        <Row label="Nationalities" value={(pickers["pb-nationality"] ?? []).join(", ")} />
        <Row label="Residence" value={String(values["pb-residence"] ?? "")} />
        <Row label="Tax residence" value={(pickers["pb-tax"] ?? []).join(", ")} />
      </SummaryCard>
      <SummaryCard title="Your private banking needs" step={21} onEdit={onEdit}>
        <Row label="Account" value={`${PB_BASELINE_ACCOUNT.label} (implicit)`} />
        <Row label="Additional services" value={extras || "None selected (account only)"} />
        <Row label="Liquid assets" value={String(values["pb-assets"] ?? "")} />
        <Row label="Expected placement (EUR)" value={fmtMoney(String(values["pb-transfer"] ?? ""))} />
        <Row label="Account currencies" value={currencies} />
        <Row label="Payment methods" value={rails} />
        <Row label="Relationship-manager language" value={String(values["pb-language"] ?? "")} />
      </SummaryCard>
      <SummaryCard title="Your background & funding" step={22} onEdit={onEdit}>
        <Row label="Professional status" value={String(values["pb-occupation"] ?? "")} />
        <Row label="Sources of wealth" value={wealth} />
      </SummaryCard>
      <SummaryCard title="Expected account activity" step={23} onEdit={onEdit}>
        <Row label="Funds in own name" value={own} />
        {showThirdParty && (
          <>
            <Row label="Third-party sender" value={String(values["pb-third-party-name"] ?? "") || "Not yet known"} />
            <Row label="Relationship" value={String(values["pb-third-party-relationship"] ?? "")} />
            <Row label="Reason" value={String(values["pb-third-party-reason"] ?? "")} />
          </>
        )}
        <Row label="Initial transfer from" value={(pickers["pb-origin-country"] ?? []).join(", ")} />
        <Row label="Regular transfers" value={regular} />
        {regular === "Yes" && (
          <>
            <Row
              label="Incoming"
              value={
                incomingInactive
                  ? "No regular incoming transfers expected"
                  : [
                      (pickers["pb-incoming"] ?? []).join(", "),
                      inEstimates,
                      inPurposes,
                    ]
                      .filter(Boolean)
                      .join(" · ")
              }
            />
            <Row
              label="Outgoing"
              value={
                outgoingInactive
                  ? "No regular outgoing transfers expected"
                  : [
                      (pickers["pb-outgoing"] ?? []).join(", "),
                      outEstimates,
                      outPurposes,
                    ]
                      .filter(Boolean)
                      .join(" · ")
              }
            />
          </>
        )}
      </SummaryCard>
    </>
  );
}
