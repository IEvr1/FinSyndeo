"use client";

import type { ReactNode } from "react";
import {
  CO_ACCOUNT_STRUCTURES,
  CO_CLIENT_TYPES,
  CO_CURRENCIES,
  CO_INSTITUTION_CATEGORIES,
  CO_PAYMENT_ROUTES,
  CO_REGIONS,
  CO_SERVICES,
  activityDeclared,
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
} from "@/lib/questionnaire/correspondent-config";
import { activeCorrespondentBranch } from "@/lib/questionnaire/validate-correspondent";
import type { CountryPickers, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onEdit: (step: number) => void;
};

function SummaryCard({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (s: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="panel summary-card">
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

function levelLabel(v: unknown) {
  return v === "required" ? "Must-have" : "Good to have";
}

function flowLines(
  scope: "operating" | "client",
  currencies: readonly string[],
  values: QuestionnaireValues,
  pickers: CountryPickers
) {
  const lines: string[] = [];
  for (const code of currencies) {
    for (const dir of ["in", "out"] as const) {
      const amount = String(values[flowKey(scope, code, dir, "amount")] ?? "");
      const count = String(values[flowKey(scope, code, dir, "count")] ?? "");
      if (!amount && !count) continue;
      const dirLabel = dir === "in" ? "Incoming" : "Outgoing";
      let line = `${code} ${dirLabel}: amount ${amount || "—"}, count ${count || "—"}`;
      if (activityDeclared(amount) || activityDeclared(count)) {
        const countries = (pickers[flowCountriesKey(scope, code, dir)] ?? []).join(", ");
        const purpose = String(values[flowKey(scope, code, dir, "purpose")] ?? "");
        if (countries) line += `; countries ${countries}`;
        if (purpose) line += `; purpose ${purpose}`;
      }
      lines.push(line);
    }
  }
  return lines.join(" · ") || "Not yet known";
}

export function CorrespondentSummary({ values, pickers, onEdit }: Props) {
  const branch = activeCorrespondentBranch(values);
  const catLabel =
    CO_INSTITUTION_CATEGORIES.find((c) => c.id === branch.category)?.label ?? branch.category;
  const website =
    values[websiteUnavailableKey()] === true
      ? `Unavailable / under development — ${String(values["co-website-reason"] ?? "")}`
      : String(values["fi-website"] ?? "");

  const clients = CO_CLIENT_TYPES.filter((t) => values[coClientTypeKey(t.id)] === true)
    .map((t) => t.label)
    .join(", ");
  const regions = CO_REGIONS.filter((r) => values[coRegionKey(r)] === true).join(", ");
  const structures = CO_ACCOUNT_STRUCTURES.filter((s) => values[coStructKey(s.id)] === true)
    .map((s) => s.label)
    .join("; ");
  const services = branch.selectedServices.map((s) => s.label).join("; ");
  const currencies = branch.selectedCurrencies
    .map((c) => `${c} (${levelLabel(values[coCurrLevelKey(c)])})`)
    .join(", ");
  const rails = CO_PAYMENT_ROUTES.filter((r) => values[coRailKey(r.id)] === true)
    .map((r) => r.label)
    .join("; ");

  const corps = branch.corporateYes
    ? parseJsonList<CoCorporateShareholder>(values["co-corporate-shareholders"])
    : [];
  const ubos = parseJsonList<CoUbo>(values["co-ubos"]);
  const providers = parseJsonList<CoExistingProvider>(values["co-existing-providers"]).filter(
    (p) => p.name || p.country || p.status
  );

  return (
    <>
      <SummaryCard title="Company and institution identity" step={1} onEdit={onEdit}>
        <Row label="Institution category" value={catLabel} />
        <Row label="Registered legal name" value={String(values["company-name"] ?? "")} />
        <Row label="Incorporation country" value={String(values.incorporation ?? "")} />
        <Row label="Registration number" value={String(values.registration ?? "")} />
        <Row label="Website" value={website} />
      </SummaryCard>

      <SummaryCard title="Institution profile" step={30} onEdit={onEdit}>
        <Row label="Regulatory status" value={String(values["fi-status"] ?? "")} />
        <Row label="Regulator / authority" value={String(values["fi-regulatory"] ?? "")} />
        <Row label="Licence / registration reference" value={String(values["fi-reference"] ?? "")} />
        <Row label="Register link" value={String(values["fi-register-link"] ?? "")} />
        <Row label="Permitted activities" value={String(values["fi-permitted"] ?? "")} />
        {branch.isMsbCanada && (
          <>
            <Row label="Canadian office" value={String(values["msb-office"] ?? "")} />
            <Row label="Canadian director" value={String(values["msb-director"] ?? "")} />
            <Row label="Bank of Canada status" value={String(values["msb-boc"] ?? "")} />
          </>
        )}
        {branch.isCasp && (
          <>
            <Row label="MiCA status" value={String(values["casp-mica"] ?? "")} />
            <Row label="Crypto assets / networks" value={String(values["casp-assets"] ?? "")} />
            <Row label="Self-hosted wallets" value={String(values["casp-wallets"] ?? "")} />
            <Row label="Travel Rule" value={String(values["casp-travel"] ?? "")} />
            <Row label="Blockchain screening" value={String(values["casp-chain"] ?? "")} />
          </>
        )}
      </SummaryCard>

      <SummaryCard title="Underlying clients" step={31} onEdit={onEdit}>
        <Row label="Client types" value={clients} />
        <Row label="Industries / activities" value={String(values["fi-client-profile"] ?? "")} />
        <Row label="Regions (context)" value={regions} />
        <Row
          label="Specific countries"
          value={(pickers["fi-underlying-countries"] ?? []).join(", ")}
        />
        <Row label="Nested institution processing" value={String(values["fi-downstream"] ?? "")} />
        {values["fi-downstream"] === "Yes" && (
          <Row label="Nested details" value={String(values["fi-downstream-text"] ?? "")} />
        )}
        <Row label="Direct client access" value={String(values["fi-access"] ?? "")} />
        {values["fi-access"] === "Yes" && (
          <Row label="Access / controls" value={String(values["fi-access-text"] ?? "")} />
        )}
      </SummaryCard>

      <SummaryCard title="Services and flows" step={32} onEdit={onEdit}>
        <Row label="Account types" value={branch.clientFunds ? "Operating + dedicated client funds" : "Operating only"} />
        <Row label="Account structures" value={structures} />
        <Row label="Additional services" value={services} />
        <Row label="Currencies" value={currencies} />
        <Row label="Payment rails" value={rails} />
        <Row label="Fund model" value={String(values["fi-fund-model"] ?? "")} />
        <Row
          label="Operating schedules"
          value={flowLines("operating", branch.selectedCurrencies, values, pickers)}
        />
        {branch.clientFunds && (
          <Row
            label="Client-funds schedules"
            value={flowLines("client", branch.selectedCurrencies, values, pickers)}
          />
        )}
      </SummaryCard>

      <SummaryCard title="Compliance" step={33} onEdit={onEdit}>
        <Row label="AMLRO" value={String(values["fi-mlro"] ?? "")} />
        <Row label="AMLRO country" value={String(values["fi-mlro-country"] ?? "")} />
        <Row label="Documented AML/KYC controls" value={String(values["fi-aml"] ?? "")} />
        <Row label="Independent AML review" value={String(values["fi-audit"] ?? "")} />
        {values["fi-audit"] === "Yes" && (
          <Row label="Review year" value={String(values["fi-audit-year"] ?? "")} />
        )}
      </SummaryCard>

      <SummaryCard title="Existing correspondent and payment relationships" step={39} onEdit={onEdit}>
        <Row label="Reason for relationship" value={String(values["fi-reason"] ?? "")} />
        <Row
          label="Existing providers"
          value={
            providers.length
              ? providers.map((p) => [p.name, p.country, p.status].filter(Boolean).join(" · ")).join("; ")
              : "None provided"
          }
        />
      </SummaryCard>

      <SummaryCard title="Ownership and control" step={4} onEdit={onEdit}>
        <Row label="Corporate shareholders" value={String(values.corporate ?? "")} />
        {branch.corporateYes && (
          <Row
            label="Corporate details"
            value={corps
              .map((c) => `${c.jurisdiction || "—"} (${c.shareholding || "—"}%)`)
              .join("; ")}
          />
        )}
        <Row
          label="UBOs"
          value={ubos
            .map((u) => {
              const nats = (pickers[`co-ubo-nat-${u.id}`] ?? u.nationalities ?? []).join("/");
              return `${u.ownership || "—"}% · ${nats || "—"} · resides ${u.residence || "—"}`;
            })
            .join("; ")}
        />
        <Row label="Ownership clarification" value={String(values["ownership-clarification"] ?? "")} />
        <Row label="Part of a group" value={String(values.group ?? "")} />
        {branch.groupYes && <Row label="Group name" value={String(values["group-name"] ?? "")} />}
        <Row
          label="Serve other group companies"
          value={String(values["group-same-institution"] ?? "")}
        />
        <Row label="UBO personal account" value={String(values["group-ubo-personal"] ?? "")} />
      </SummaryCard>

      <SummaryCard title="Contact" step={5} onEdit={onEdit}>
        <Row label="Contact name" value={String(values["contact-name"] ?? "")} />
        <Row label="Contact email" value={String(values["contact-email"] ?? "")} />
        <Row label="Capacity" value={String(values["representative-role"] ?? "")} />
      </SummaryCard>
    </>
  );
}
