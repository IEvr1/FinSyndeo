import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { gateEmail, sendEmail } from "@/lib/integrations";
import {
  EMAIL_TEMPLATE_VERSION,
  renderEmailHtml,
  renderSubject,
  type TemplateId,
} from "@/lib/email/templates";

export async function enqueueEmail(params: {
  templateId: TemplateId;
  businessEvent: string;
  idempotencyKey: string;
  to: string[];
  cc?: string[];
  vars: Record<string, string>;
  revisionId?: string;
  bodyOverride?: string;
}) {
  const db = getDb();
  const gate = gateEmail();
  const [event] = await db
    .insert(schema.outboxEvents)
    .values({
      templateId: params.templateId,
      businessEvent: params.businessEvent,
      idempotencyKey: params.idempotencyKey,
      revisionId: params.revisionId,
      toAddresses: params.to,
      ccAddresses: params.cc ?? [],
      payload: {
        vars: params.vars,
        templateVersion: EMAIL_TEMPLATE_VERSION,
        bodyOverride: params.bodyOverride,
      },
      state: gate.ready ? "pending" : "blocked",
      lastError: gate.reason,
    })
    .onConflictDoNothing()
    .returning();

  return event;
}

export async function processOutboxBatch(limit = 20) {
  const db = getDb();
  const gate = gateEmail();
  if (!gate.ready) return { processed: 0, reason: gate.reason };

  const pending = await db
    .select()
    .from(schema.outboxEvents)
    .where(eq(schema.outboxEvents.state, "pending"))
    .limit(limit);

  let processed = 0;
  for (const event of pending) {
    const payload = event.payload as {
      vars: Record<string, string>;
      bodyOverride?: string;
    };
    const templateId = event.templateId as TemplateId;
    const html = renderEmailHtml(templateId, payload.vars, payload.bodyOverride);
    const subject = renderSubject(templateId, payload.vars);
    const result = await sendEmail({
      to: event.toAddresses as string[],
      cc: (event.ccAddresses as string[]) ?? undefined,
      subject,
      html,
      idempotencyKey: event.idempotencyKey,
    });

    await db
      .update(schema.outboxEvents)
      .set({
        state: result.sent ? "sent" : "failed",
        sentAt: result.sent ? new Date() : undefined,
        attempts: event.attempts + 1,
        lastError: result.error,
      })
      .where(eq(schema.outboxEvents.id, event.id));
    if (result.sent) processed++;
  }

  return { processed };
}
