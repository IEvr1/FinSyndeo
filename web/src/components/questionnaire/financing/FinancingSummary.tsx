"use client";

import type { ReactNode } from "react";
import {
  FINANCE_PURPOSES,
  FINANCE_TIMELINES,
  financePurposeKey,
} from "@/lib/questionnaire/financing-config";
import {
  activeAuditedYears,
  activeFinanceFacilities,
} from "@/lib/questionnaire/validate-financing";
import type { CountryPickers, QuestionnaireValues } from "@/lib/questionnaire/types";

type Props = {
  values: QuestionnaireValues;
  pickers: CountryPickers;
  onEdit: (step: number) => void;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return (
    <div className="summary-row contents">
      <dt>{label}</dt>
      <dd style={{ whiteSpace: "pre-wrap" }}>{text}</dd>
    </div>
  );
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <header className="flex justify-between items-center gap-3">
        <h2>{title}</h2>
        <button type="button" className="mini" onClick={() => onEdit(step)}>
          Edit {title}
        </button>
      </header>
      <dl className="summary">{children}</dl>
    </section>
  );
}

function purposeLabel(raw: string): string {
  const key = financePurposeKey(raw);
  return FINANCE_PURPOSES.find((p) => p.key === key)?.label ?? raw;
}

function timelineLabel(raw: string): string {
  return FINANCE_TIMELINES.find((t) => t.value === raw)?.label ?? raw;
}

export function FinancingSummary({ values, pickers, onEdit }: Props) {
  const purposeKey = financePurposeKey(String(values["finance-purpose"] ?? ""));
  const existing = String(values["finance-existing"] ?? "");
  const security = String(values["finance-security"] ?? "");
  const auditedYears = activeAuditedYears(values);
  const facilities = activeFinanceFacilities(values);
  const banking = String(values["finance-existing-banking"] || values["existing-banking"] || "");
  const termUnknown = values["finance-term-unknown"] === true;

  return (
    <div className="financing-summary">
      <p className="lead">
        Review your answers before finding potential matches. Matching is not loan approval and does not contact a
        lender.
      </p>

      <Section title="Entity details" step={1} onEdit={onEdit}>
        <Row label="Registered entity name" value={String(values["company-name"] ?? "")} />
        <Row label="Incorporation jurisdiction" value={String(values.incorporation ?? "")} />
        <Row
          label="Registration identifier"
          value={
            values["registration-notissued"] === true
              ? `Exception: ${String(values["registration-exception-reason"] ?? "")}`
              : String(values.registration ?? "")
          }
        />
        <Row label="Legal entity type" value={String(values["entity-type"] ?? "")} />
      </Section>

      <Section title="Business activity" step={2} onEdit={onEdit}>
        <Row label="Industry" value={String(values.industry ?? "")} />
        <Row label="Activity description" value={String(values.activity ?? "")} />
        <Row
          label="Website"
          value={
            String(values["finance-website-status"] ?? values["website-status"] ?? "") === "available"
              ? String(values.website ?? "")
              : String(values["finance-website-status"] ?? values["website-status"] ?? values.website ?? "")
          }
        />
      </Section>

      <Section title="Financing need" step={12} onEdit={onEdit}>
        <Row label="Purpose" value={purposeLabel(String(values["finance-purpose"] ?? ""))} />
        {purposeKey === "other" && (
          <Row label="Other purpose" value={String(values["finance-other-text"] ?? "")} />
        )}
        <Row
          label="Amount sought"
          value={
            String(values["finance-amount"] ?? "") && String(values["finance-currency"] ?? "")
              ? `${values["finance-amount"]} ${values["finance-currency"]}`
              : ""
          }
        />
        <Row label="Use of funds" value={String(values["finance-use"] ?? "")} />
        <Row label="Timing" value={timelineLabel(String(values["finance-timeline"] ?? ""))} />
        {String(values["finance-timeline"]) === "specific_date" && (
          <Row label="Required date" value={String(values["finance-date"] ?? "")} />
        )}
        <Row
          label="Preferred repayment term"
          value={termUnknown ? "Not yet sure" : String(values["finance-term"] ?? "") ? `${values["finance-term"]} years` : ""}
        />
      </Section>

      <Section title="Business and project" step={13} onEdit={onEdit}>
        <Row label="Stage" value={String(values["finance-stage"] ?? "")} />
        <Row label="Project / asset location" value={String(values["finance-project-country"] ?? "")} />
        {purposeKey === "maritime_vessel_finance" && (
          <Row label="Vessel / investment details" value={String(values["finance-vessel-details"] ?? "")} />
        )}
        <Row label="Brief update" value={String(values["finance-project"] ?? "")} />
        <Row label="Revenue status" value={String(values["finance-revenue-status"] ?? "")} />
        <Row label="Reporting currency" value={String(values["finance-report-currency"] ?? "")} />
        {String(values["finance-revenue"] ?? "").trim() !== "" && (
          <Row
            label="Latest annual revenue"
            value={`${values["finance-revenue"]} (${values["finance-revenue-year"] ?? "year not set"})`}
          />
        )}
        {String(values["finance-profit"] ?? "").trim() !== "" && (
          <Row label="Profit or loss" value={String(values["finance-profit"] ?? "")} />
        )}
        <Row label="Audited statements available" value={String(values["finance-audited"] ?? "")} />
        {auditedYears.length > 0 && (
          <Row label="Available audited years" value={auditedYears.join(", ")} />
        )}
      </Section>

      <Section title="Financing and security" step={14} onEdit={onEdit}>
        <Row label="Existing financing" value={existing} />
        {existing === "Yes" &&
          facilities.map((f, i) => (
            <Row
              key={i}
              label={`Facility ${i + 1}`}
              value={`${f.lender} — ${f.type}; ${f.amount} ${f.currency}; maturity ${f.maturity}`}
            />
          ))}
        {purposeKey === "refinancing" && existing === "Yes" && (
          <Row label="Refinancing targets" value={String(values["finance-refinance"] ?? "")} />
        )}
        <Row label="Security available" value={security} />
        {security === "Yes" && (
          <>
            <Row label="Assets / guarantees" value={String(values["finance-security-details"] ?? "")} />
            <Row
              label="Estimated value"
              value={
                String(values["finance-security-value"] ?? "")
                  ? `${values["finance-security-value"]} ${values["finance-security-currency"] ?? ""}`
                  : ""
              }
            />
            <Row label="Already pledged" value={String(values["finance-pledged"] ?? "")} />
          </>
        )}
      </Section>

      <Section title="Existing banking" step={39} onEdit={onEdit}>
        <Row label="Existing banking relationship" value={banking} />
        {(banking === "Yes" || banking === "Previously held now closed") && (
          <>
            <Row label="Bank name" value={String(values["bank-name"] ?? "")} />
            <Row label="Bank country" value={String(values["bank-country"] ?? pickers["bank-country"]?.[0] ?? "")} />
          </>
        )}
      </Section>

      <Section title="Ownership and group" step={4} onEdit={onEdit}>
        <Row label="Part of a group" value={String(values.group ?? "")} />
        {String(values.group) === "Yes" && (
          <Row label="Group name" value={String(values["group-name"] ?? "") || "Not provided"} />
        )}
        <Row
          label="Corporate shareholders / partners / members"
          value={String(values.corporate ?? "")}
        />
      </Section>

      <Section title="Contact" step={5} onEdit={onEdit}>
        <Row label="Contact name" value={String(values["contact-name"] ?? "")} />
        <Row label="Contact email" value={String(values["contact-email"] ?? "")} />
        <Row label="Capacity" value={String(values["representative-role"] ?? "")} />
        <Row
          label="Preferred relationship-manager language"
          value={String(values["relationship-manager-language"] ?? "")}
        />
      </Section>
    </div>
  );
}
