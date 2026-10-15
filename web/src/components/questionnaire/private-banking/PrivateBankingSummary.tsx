"use client";

import type { ReactNode } from "react";
import {
  PB_CURRENCIES,
  PB_FUND_SOURCES,
  PB_SERVICES,
  PB_WEALTH_SOURCES,
  currKey,
  fundKey,
  svcKey,
  wealthKey,
} from "@/lib/questionnaire/private-banking-config";
import type { CountryPickers, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onEdit: (step: number) => void;
};

function fmtMoney(amount: string, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount || "Not specified";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "EUR" }).format(n);
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
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

export function PrivateBankingSummary({ values, pickers, onEdit }: Props) {
  const own = String(values["pb-own-funds"] ?? "");
  const showThirdParty = own === "No";

  const services = PB_SERVICES
    .filter((s) => values[svcKey(s.id)] === true)
    .map((s) => {
      const level = values[`pb-svc-level:${s.id}`] === "required" ? "Required" : "Preferred";
      return `${s.label} (${level})`;
    })
    .join("; ");

  const currencies = PB_CURRENCIES
    .filter((c) => values[currKey(c)] === true)
    .map((c) => (c === "Other" ? values["pb-currencies-text"] : c))
    .filter(Boolean)
    .join(", ");

  const wealth = PB_WEALTH_SOURCES.filter((s) => values[wealthKey(s.id)] === true).map((s) => s.label).join("; ");
  const funds = PB_FUND_SOURCES.filter((s) => values[fundKey(s.id)] === true).map((s) => s.label).join("; ");

  return (
    <>
      <SummaryCard title="Personal details" step={20} onEdit={onEdit}>
        <Row label="Name" value={[values["pb-name"], values["pb-surname"]].filter(Boolean).join(" ")} />
        <Row label="Contact email" value={String(values["pb-email"] ?? "")} />
        <Row label="Nationalities" value={(pickers["pb-nationality"] ?? []).join(", ")} />
        <Row label="Residence" value={String(values["pb-residence"] ?? "")} />
        <Row label="Tax residence" value={(pickers["pb-tax"] ?? []).join(", ")} />
      </SummaryCard>
      <SummaryCard title="Your private banking needs" step={21} onEdit={onEdit}>
        <Row label="Services" value={services} />
        <Row label="Liquid assets" value={String(values["pb-assets"] ?? "")} />
        <Row
          label="Expected placement"
          value={fmtMoney(String(values["pb-transfer"] ?? ""), String(values["pb-placement-currency"] ?? "EUR"))}
        />
        <Row label="Account currencies" value={currencies} />
        <Row label="Relationship-manager language" value={String(values["pb-language"] ?? "")} />
      </SummaryCard>
      <SummaryCard title="Your background & funding" step={22} onEdit={onEdit}>
        <Row label="Professional status" value={String(values["pb-occupation"] ?? "")} />
        <Row label="Sources of wealth" value={wealth} />
        <Row label="Source of proposed funds" value={funds} />
      </SummaryCard>
      <SummaryCard title="Expected account activity" step={23} onEdit={onEdit}>
        <Row label="Initial transfer from" value={(pickers["pb-origin-country"] ?? []).join(", ")} />
        <Row label="Funds in own name" value={own} />
        {showThirdParty && (
          <>
            <Row label="Third-party sender" value={String(values["pb-third-party-name"] ?? "")} />
            <Row label="Relationship" value={String(values["pb-third-party-relationship"] ?? "")} />
          </>
        )}
        <Row label="Regular transfers" value={String(values["pb-regular-transfers"] ?? "")} />
      </SummaryCard>
    </>
  );
}
