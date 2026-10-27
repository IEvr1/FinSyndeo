"use client";

import type { ReactNode } from "react";
import { LE_PURPOSES } from "@/lib/questionnaire/legal-entity-bank-config";
import {
  MERCHANT_BANK_ACCOUNT_TYPES,
  MERCHANT_BANK_CURRENCIES,
  MERCHANT_CHANNELS,
  MERCHANT_FIND_BANK_KEY,
  MERCHANT_FULFILMENT,
  MERCHANT_HISTORY_STATUS,
  MERCHANT_OFFICE_STATUS,
  MERCHANT_PAY_PATTERNS,
  MERCHANT_PLATFORMS,
  MERCHANT_SALES_ROLE,
  MERCHANT_SETTLEMENT_CURRENCIES,
  MERCHANT_SETTLEMENT_TYPE,
  MERCHANT_WEBSITE_STATUS,
  bankAcctKey,
  bankCurrKey,
  bankCurrLevelKey,
  channelKey,
  chargebackCountKey,
  chargebackRatioKey,
  chargebackUnavailableKey,
  deriveAverage,
  formatChargebackMonthLabel,
  lastSixCompletedMonths,
  methodFamilyLabel,
  namedMethodLabel,
  parseMarkets,
  payPatternKey,
  salesRoleKey,
  settlementCurrencyKey,
  settlementTypeKey,
} from "@/lib/questionnaire/merchant-config";
import {
  isCombinedBankMerchant,
  resolveMerchantServiceScope,
} from "@/lib/questionnaire/validate-merchant";
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

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes" || v === "on";
}

function str(v: unknown): string {
  return String(v ?? "").trim();
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

function levelLabel(v: unknown) {
  return v === "required" ? "Must-have" : v === "preferred" ? "Good to have" : "";
}

function websiteStatusLabel(v: string) {
  return MERCHANT_WEBSITE_STATUS.find((s) => s.value === v)?.label ?? v;
}

function officeLabel(v: string) {
  return MERCHANT_OFFICE_STATUS.find((o) => o.value === v)?.label ?? v;
}

export function MerchantSummary({ values, pickers, onEdit }: Props) {
  const scope = resolveMerchantServiceScope(values);
  const combined = isCombinedBankMerchant(values);
  const entityType = str(values["entity-type"]);
  const association = /^association$/i.test(entityType);
  const websiteStatus = str(values["website-status"] || values["merchant-website-status"]);
  const offices = str(values.offices || values["office-status"] || values["merchant-office-status"]);
  const licence = str(values.licence);
  const online = bool(values[channelKey("online")]) || bool(values.online);
  const pos = bool(values[channelKey("pos")]) || bool(values.pos);
  const salesRole = str(values[salesRoleKey()]);
  const markets = parseMarkets(values);
  const historyStatus = str(values["merchant-history-status"] || values.history);
  const experienced = historyStatus === "currently" || historyStatus === "previously";
  const settlementType = str(values[settlementTypeKey()] || values["settlement-type"]);
  const corp = str(values.corporate);
  const group = str(values.group);

  const channels = MERCHANT_CHANNELS.filter(
    (c) => bool(values[channelKey(c.id)]) || bool(values[c.id])
  )
    .map((c) => c.label)
    .join("; ");

  const patterns = [
    ...MERCHANT_PAY_PATTERNS.filter((p) => bool(values[payPatternKey(p.id)])).map((p) => p.label),
    ...(bool(values[payPatternKey("moto")]) ? ["MOTO"] : []),
  ].join("; ");

  const marketLines = markets.map((m) => {
    const methods = (m.methods ?? [])
      .map((meth) => {
        const label = namedMethodLabel(meth.family, meth.method) || methodFamilyLabel(meth.family);
        const currs = (meth.currencies ?? [])
          .map((c) => {
            if (c.unknown) return `${c.currency || "—"} (not yet known)`;
            const avg = deriveAverage(c.monthlyValue, c.monthlyCount);
            return `${c.currency || "—"}: value ${c.monthlyValue ?? "—"} / count ${c.monthlyCount ?? "—"}${
              avg !== null
                ? ` · avg estimate ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                : ""
            }`;
          })
          .join("; ");
        return `${label} (${meth.sharePercent || "—"}%)${currs ? ` — ${currs}` : ""}`;
      })
      .join(" | ");
    return `${m.kind === "region" ? "Region" : "Country"} ${m.name || "—"} (${m.sharePercent || "—"}%): ${methods || "no methods"}`;
  });

  const completedRaw = Number(
    str(values["merchant-history-months"] ?? values["history-months"] ?? values["completed-months"])
  );
  const monthSlice = Number.isFinite(completedRaw)
    ? lastSixCompletedMonths().slice(0, Math.max(0, Math.min(6, Math.floor(completedRaw))))
    : lastSixCompletedMonths();

  const chargebackLines = experienced
    ? monthSlice.map((ym) => {
        if (bool(values[chargebackUnavailableKey(ym)])) {
          return `${formatChargebackMonthLabel(ym)}: N/A`;
        }
        const count = values[chargebackCountKey(ym)];
        const ratio = values[chargebackRatioKey(ym)];
        if (count == null && ratio == null) return "";
        return `${formatChargebackMonthLabel(ym)}: ${count ?? "—"} / ${ratio ?? "—"}%`;
      }).filter(Boolean)
    : [];

  const settleCurrencies = MERCHANT_SETTLEMENT_CURRENCIES.filter(
    (c) => bool(values[settlementCurrencyKey(c)]) || bool(values[`settle-curr:${c}`])
  ).join(", ");

  const bankAccounts = MERCHANT_BANK_ACCOUNT_TYPES.filter((a) => bool(values[bankAcctKey(a.id)]))
    .map((a) => a.label)
    .join("; ");
  const bankCurrencies = MERCHANT_BANK_CURRENCIES.filter((c) => bool(values[bankCurrKey(c)]))
    .map((c) => `${c} (${levelLabel(values[bankCurrLevelKey(c)]) || "—"})`)
    .join(", ");
  const purposes = LE_PURPOSES.filter((p) => bool(values[`bank-purpose:${p.id}`]))
    .map((p) => p.label)
    .join("; ");

  const ubos = parseJsonList<{ ownership?: string }>(values["merchant-ubos"] || values["co-ubos"]);
  const uboCoverage = ubos.reduce((s, u) => s + (Number(u.ownership) || 0), 0);
  const roles = parseJsonList<{ role?: string }>(values["merchant-governing-roles"]);
  const future = parseJsonList<{
    family?: string;
    method?: string;
    forDiscussion?: boolean;
    notDecided?: boolean;
  }>(values["merchant-future-methods"]);

  const platformId = str(values.platform || values["merchant-platform"]);
  const platformLabel = MERCHANT_PLATFORMS.find((p) => p.id === platformId)?.label ?? platformId;

  return (
    <>
      <SummaryCard title="Service scope" step={0} onEdit={onEdit}>
        <Row
          label="Scope"
          value={scope === "both" ? "Bank account + Merchant" : "Merchant"}
        />
        <Row label="Entity type" value={entityType} />
        <Row label="Registered name" value={str(values["company-name"])} />
        <Row label="Incorporation" value={str(values.incorporation)} />
      </SummaryCard>

      <SummaryCard title="Business activity" step={2} onEdit={onEdit}>
        <Row label="Website status" value={websiteStatusLabel(websiteStatus)} />
        {websiteStatus === "available" && <Row label="Website" value={str(values.website)} />}
        {(websiteStatus === "under_development" || websiteStatus === "not_applicable") && (
          <Row label="Website reason" value={str(values["website-reason"] || values["website-unavailable-reason"])} />
        )}
        <Row label="Website summary reviewed" value={values["website-summary-confirmed"] === true ? "Yes" : ""} />
        <Row label="Industry" value={str(values.industry)} />
        {/^other$/i.test(str(values.industry)) && (
          <Row label="Other industry" value={str(values["industry-other"])} />
        )}
        <Row label="Activity" value={str(values.activity)} />
        <Row label="Licence" value={licence} />
        {licence === "Yes" && (
          <>
            <Row label="Licence name" value={str(values["licence-name"])} />
            <Row label="Licence number" value={str(values["licence-number"])} />
            <Row label="Authority" value={str(values["licence-authority"])} />
            <Row label="Licence jurisdiction" value={str(values["licence-jurisdiction"])} />
          </>
        )}
        {str(values["eu-payment-agent"]) && (
          <Row label="EU payment agent" value={str(values["eu-payment-agent"])} />
        )}
        <Row label="Offices" value={officeLabel(offices)} />
        {offices === "other_countries" && (
          <Row
            label="Operating countries"
            value={(pickers["operating-countries"] ?? pickers["office-countries"] ?? []).join(", ")}
          />
        )}
        <Row label="Employees" value={str(values.employees)} />
      </SummaryCard>

      {combined && (
        <SummaryCard title="Bank account requirements" step={3} onEdit={onEdit}>
          <Row label="Account types" value={bankAccounts} />
          <Row label="Purposes" value={purposes} />
          <Row label="Currencies" value={bankCurrencies} />
        </SummaryCard>
      )}

      <SummaryCard title="Ownership and control" step={4} onEdit={onEdit}>
        {!association && (
          <>
            <Row label="Corporate shareholders" value={corp} />
            {corp === "Yes" && (
              <Row
                label="Corporate shareholdings"
                value={parseJsonList<{ jurisdiction?: string; shareholding?: string }>(
                  values["merchant-corporate-shareholders"] || values["co-corporate-shareholders"]
                )
                  .map((r) => `${r.jurisdiction || "—"} (${r.shareholding || "—"}%)`)
                  .join("; ")}
              />
            )}
            <Row
              label="Beneficial ownership coverage"
              value={ubos.length ? `${uboCoverage.toFixed(2)}%` : ""}
            />
            {str(values["ownership-clarification"]) && (
              <Row label="Clarification" value={str(values["ownership-clarification"])} />
            )}
          </>
        )}
        {association && (
          <Row
            label="Governing roles"
            value={roles.map((r) => r.role || "Role").join("; ")}
          />
        )}
        <Row label="Part of a group" value={group} />
        {group === "Yes" && <Row label="Group name" value={str(values["group-name"])} />}
      </SummaryCard>

      <SummaryCard title="Payment channels" step={7} onEdit={onEdit}>
        <Row label="Channels" value={channels} />
        {online && (
          <>
            <Row
              label="Checkout"
              value={
                bool(values["checkout-same-as-website"])
                  ? "Same as company website"
                  : str(values["checkout-url"] || values["payment-website"])
              }
            />
            <Row label="Platform" value={platformLabel} />
            <Row label="Gateway" value={str(values.gateway || values["merchant-gateway"])} />
          </>
        )}
        {pos && (
          <>
            <Row
              label="Store countries"
              value={
                bool(values["store-not-yet-decided"]) ||
                str(values["store-countries-status"]) === "not_yet_decided"
                  ? "Not yet decided"
                  : (pickers["physical-store-countries"] ?? pickers["store-countries"] ?? []).join(", ")
              }
            />
            <Row label="Locations" value={str(values["store-locations"] || values["pos-locations"])} />
            <Row label="Terminals" value={str(values["pos-terminals"])} />
          </>
        )}
        <Row
          label="Sales role"
          value={MERCHANT_SALES_ROLE.find((r) => r.value === salesRole)?.label ?? salesRole}
        />
        {(salesRole === "marketplace" || salesRole === "both") && (
          <Row label="Marketplace model" value={str(values["sales-model-description"])} />
        )}
        <Row label="Payment patterns" value={patterns} />
        <Row
          label="Fulfilment"
          value={
            MERCHANT_FULFILMENT.find(
              (f) => f.value === str(values.fulfilment || values["merchant-fulfilment"])
            )?.label ?? str(values.fulfilment)
          }
        />
      </SummaryCard>

      <SummaryCard title="Markets and volumes" step={8} onEdit={onEdit}>
        {marketLines.length ? (
          marketLines.map((line, i) => <Row key={i} label={`Market ${i + 1}`} value={line} />)
        ) : (
          <Row label="Markets" value="None added" />
        )}
      </SummaryCard>

      <SummaryCard title="Processing history" step={9} onEdit={onEdit}>
        <Row
          label="Status"
          value={MERCHANT_HISTORY_STATUS.find((s) => s.value === historyStatus)?.label ?? historyStatus}
        />
        {experienced && (
          <Row
            label="Completed months"
            value={str(values["merchant-history-months"] ?? values["completed-months"])}
          />
        )}
        <Row label="Statement availability" value={str(values["merchant-statement-availability"])} />
        <Row
          label="Current provider"
          value={str(values["merchant-current-provider"] || values["current-provider"])}
        />
        {experienced &&
          (chargebackLines.length ? (
            chargebackLines.map((line, i) => <Row key={i} label="Chargebacks" value={line} />)
          ) : (
            <Row label="Chargebacks" value="N/A" />
          ))}
        <Row label="Fraud ratio (%)" value={str(values["merchant-fraud"] || values["fraud-ratio"])} />
        <Row label="PCI" value={str(values["merchant-pci"])} />
      </SummaryCard>

      <SummaryCard title="Pricing and additional requirements" step={10} onEdit={onEdit}>
        <Row
          label="Target blended rate (%)"
          value={str(values["merchant-target-rate"] || values["target-rate"])}
        />
        <Row
          label="Future methods"
          value={future
            .map((f) => {
              const label =
                namedMethodLabel(f.family || "", f.method || "") ||
                methodFamilyLabel(f.family || "") ||
                "Method";
              const bits = [label];
              if (f.notDecided) bits.push("not yet decided");
              if (f.forDiscussion) bits.push("for discussion");
              return bits.join(" · ");
            })
            .join("; ")}
        />
      </SummaryCard>

      <SummaryCard title="Settlement" step={11} onEdit={onEdit}>
        <Row
          label="Settlement type"
          value={MERCHANT_SETTLEMENT_TYPE.find((t) => t.value === settlementType)?.label ?? settlementType}
        />
        {(settlementType === "bank" || settlementType === "both") && (
          <>
            <Row label="Fiat currencies" value={settleCurrencies} />
            <Row
              label="Receiving account"
              value={str(values["merchant-receiving-account"] || values["receiving-account"])}
            />
            <Row
              label="Settlement bank"
              value={str(values["merchant-settlement-bank"] || values["settlement-bank"])}
            />
          </>
        )}
        {(settlementType === "crypto" || settlementType === "both") && (
          <>
            <Row label="Crypto asset" value={str(values["merchant-settle-crypto-asset"])} />
            <Row label="Network" value={str(values["merchant-settle-crypto-network"])} />
          </>
        )}
        <Row
          label="Own-name acknowledgement"
          value={
            values["merchant-settlement-own-name"] === true ||
            values["settlement-own-name-ack"] === true
              ? "Acknowledged"
              : ""
          }
        />
        <Row
          label="Bank account request"
          value={
            str(values["account-type"]) === "both" ||
            str(values[MERCHANT_FIND_BANK_KEY]) === "Yes"
              ? "Yes"
              : "No"
          }
        />
      </SummaryCard>
    </>
  );
}
