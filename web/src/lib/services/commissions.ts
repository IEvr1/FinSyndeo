import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  computeEligibleNet,
  computeShareMinor,
  effectiveTermsAtPosting,
  type ReceiptTaxMode,
} from "@/lib/accounting";
import { writeAudit } from "@/lib/services/audit";
import { relationshipQualifiesForCommission } from "@/lib/services/relationships";
import { enqueueEmail } from "@/lib/services/outbox";
import { isActionBlocked } from "@/lib/unresolved";

export type ReceiptLineInput = {
  statementLineId: string;
  relationshipId: string;
  grossMinor: number;
  vatMinor: number;
  withholdingMinor: number;
  chargesMinor: number;
  taxMode: ReceiptTaxMode;
  actualCashMinor: number;
};

export type ReceiptHeaderInput = {
  providerId: string;
  bankReference: string;
  currency: string;
  valueDate: Date;
  verifiedCashMinor: number;
  statementReference?: string;
  periodLabel?: string;
  verifiedByUserId?: string;
};

export class CommissionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function postProviderReceipt(header: ReceiptHeaderInput, lines: ReceiptLineInput[]) {
  if (lines.length === 0) {
    throw new CommissionError("NO_LINES", "At least one allocation line is required.");
  }

  const tailBlock = isActionBlocked("termination_policy_automation");
  const db = getDb();

  const sumCash = lines.reduce((s, l) => s + l.actualCashMinor, 0);
  if (sumCash !== header.verifiedCashMinor) {
    throw new CommissionError(
      "CASH_MISMATCH",
      "Sum of allocation cash does not match verified receipt total."
    );
  }

  let statementId: string | undefined;
  if (header.statementReference && header.periodLabel) {
    const [stmt] = await db
      .insert(schema.providerStatements)
      .values({
        providerId: header.providerId,
        statementReference: header.statementReference,
        periodLabel: header.periodLabel,
      })
      .returning();
    statementId = stmt.id;
  }

  const [receipt] = await db
    .insert(schema.providerCashReceipts)
    .values({
      providerId: header.providerId,
      statementId,
      bankReference: header.bankReference,
      currency: header.currency,
      valueDate: header.valueDate,
      verifiedCashMinor: header.verifiedCashMinor,
      verifiedByUserId: header.verifiedByUserId,
    })
    .returning();

  const introducersNotified = new Set<string>();
  const postedEntries: string[] = [];

  try {
    for (const line of lines) {
      const [rel] = await db
        .select()
        .from(schema.providerRelationships)
        .where(eq(schema.providerRelationships.id, line.relationshipId))
        .limit(1);
      if (!rel) throw new CommissionError("RELATIONSHIP_NOT_FOUND", "Relationship not found.");

      const [client] = await db
        .select()
        .from(schema.canonicalClients)
        .where(eq(schema.canonicalClients.id, rel.clientId))
        .limit(1);
      if (!client?.introducerId) {
        throw new CommissionError("NO_INTRODUCER", "Client has no introducer attribution.");
      }

      const [introducer] = await db
        .select()
        .from(schema.introducers)
        .where(eq(schema.introducers.id, client.introducerId))
        .limit(1);
      if (!introducer) throw new CommissionError("INTRODUCER_NOT_FOUND", "Introducer not found.");

      let holdReason: string | null = null;
      if (!relationshipQualifiesForCommission(rel)) {
        holdReason = "Relationship not yet activated or financing disbursement not recorded.";
      }
      if (introducer.status === "terminated" && tailBlock.blocked) {
        holdReason = "Termination tail policy not configured — allocation held.";
      }

      const { expectedCashMinor, eligibleNetMinor } = computeEligibleNet({
        grossMinor: line.grossMinor,
        vatMinor: line.vatMinor,
        withholdingMinor: line.withholdingMinor,
        chargesMinor: line.chargesMinor,
        mode: line.taxMode,
      });

      if (line.actualCashMinor !== expectedCashMinor) {
        holdReason = "Actual cash does not match tax treatment calculation.";
      }

      const [allocation] = await db
        .insert(schema.receiptAllocations)
        .values({
          receiptId: receipt.id,
          statementLineId: line.statementLineId,
          relationshipId: line.relationshipId,
          grossMinor: line.grossMinor,
          vatMinor: line.vatMinor,
          withholdingMinor: line.withholdingMinor,
          chargesMinor: line.chargesMinor,
          taxMode: line.taxMode,
          expectedCashMinor,
          eligibleNetMinor,
          actualCashMinor: line.actualCashMinor,
          holdReason: holdReason ?? undefined,
        })
        .returning();

      if (holdReason) continue;

      const postedAt = new Date().toISOString();
      const terms = effectiveTermsAtPosting(
        introducer.tierAchieved,
        introducer.bespokeRate,
        postedAt,
        "schedule-v1",
        Date.now()
      );
      const shareMinor = computeShareMinor(eligibleNetMinor, terms.ratePercent);

      const [entry] = await db
        .insert(schema.commissionEntries)
        .values({
          introducerId: introducer.id,
          clientId: client.id,
          providerId: header.providerId,
          relationshipId: rel.id,
          receiptAllocationId: allocation.id,
          statementLineId: line.statementLineId,
          grossMinor: line.grossMinor,
          netMinor: eligibleNetMinor,
          shareMinor,
          currency: header.currency,
          ratePercent: terms.ratePercent,
          termsSnapshot: terms,
        })
        .returning();

      await db
        .update(schema.receiptAllocations)
        .set({ commissionEntryId: entry.id })
        .where(eq(schema.receiptAllocations.id, allocation.id));

      postedEntries.push(entry.id);
      introducersNotified.add(introducer.id);

      await writeAudit({
        actorUserId: header.verifiedByUserId,
        action: "commission.posted",
        resourceType: "commission_entry",
        resourceId: entry.id,
        metadata: { statementLineId: line.statementLineId, shareMinor },
      });
    }
  } catch (e) {
    throw e;
  }

  for (const introducerId of introducersNotified) {
    const [intro] = await db
      .select()
      .from(schema.introducers)
      .where(eq(schema.introducers.id, introducerId))
      .limit(1);
    if (!intro) continue;
    await enqueueEmail({
      templateId: "E19",
      businessEvent: "commission.statement_updated",
      idempotencyKey: `E19:${receipt.id}:${introducerId}`,
      to: [intro.email],
      vars: {
        "contact name": intro.displayName,
        "ledger link": `/introducer/ledger`,
      },
    });
  }

  return { receiptId: receipt.id, postedEntryIds: postedEntries };
}

export async function createSupplierInvoice(params: {
  introducerId: string;
  invoiceNumber: string;
  currency: string;
  commissionEntryIds: string[];
  taxMinor: number;
}) {
  const db = getDb();
  const entries = [];
  for (const id of params.commissionEntryIds) {
    const [entry] = await db
      .select()
      .from(schema.commissionEntries)
      .where(eq(schema.commissionEntries.id, id))
      .limit(1);
    if (!entry || entry.introducerId !== params.introducerId) {
      throw new CommissionError("ENTRY_INVALID", "Commission entry not available for invoicing.");
    }
    const [existing] = await db
      .select()
      .from(schema.supplierInvoiceAllocations)
      .where(eq(schema.supplierInvoiceAllocations.commissionEntryId, id))
      .limit(1);
    if (existing) {
      throw new CommissionError("ENTRY_INVOICED", "Commission entry already allocated to an invoice.");
    }
    entries.push(entry);
  }

  const subtotalMinor = entries.reduce((s, e) => s + e.shareMinor, 0);
  const totalMinor = subtotalMinor + params.taxMinor;

  const [invoice] = await db
    .insert(schema.supplierInvoices)
    .values({
      introducerId: params.introducerId,
      invoiceNumber: params.invoiceNumber,
      currency: params.currency,
      subtotalMinor,
      taxMinor: params.taxMinor,
      totalMinor,
      status: "submitted",
    })
    .returning();

  for (const entry of entries) {
    await db.insert(schema.supplierInvoiceAllocations).values({
      invoiceId: invoice.id,
      commissionEntryId: entry.id,
      amountMinor: entry.shareMinor,
    });
  }

  return invoice;
}

export async function recordSupplierPayment(params: {
  invoiceId: string;
  amountMinor: number;
  currency: string;
  valueDate: Date;
  bankReference: string;
  recordedByUserId?: string;
}) {
  const db = getDb();
  const [invoice] = await db
    .select()
    .from(schema.supplierInvoices)
    .where(eq(schema.supplierInvoices.id, params.invoiceId))
    .limit(1);
  if (!invoice) throw new CommissionError("INVOICE_NOT_FOUND", "Invoice not found.");

  const [payment] = await db
    .insert(schema.supplierPayments)
    .values({
      invoiceId: params.invoiceId,
      amountMinor: params.amountMinor,
      currency: params.currency,
      valueDate: params.valueDate,
      bankReference: params.bankReference,
      recordedByUserId: params.recordedByUserId,
      status: "recorded",
    })
    .returning();

  await db
    .update(schema.supplierInvoices)
    .set({ status: "paid" })
    .where(eq(schema.supplierInvoices.id, params.invoiceId));

  const [intro] = await db
    .select()
    .from(schema.introducers)
    .where(eq(schema.introducers.id, invoice.introducerId))
    .limit(1);

  if (intro) {
    await enqueueEmail({
      templateId: "E20",
      businessEvent: "commission.payment_recorded",
      idempotencyKey: `E20:${payment.id}`,
      to: [intro.email],
      vars: {
        "contact name": intro.displayName,
        "secure invoice link": `/introducer/payments`,
      },
    });
  }

  return payment;
}
