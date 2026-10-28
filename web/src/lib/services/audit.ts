import { getDb, schema } from "@/lib/db";

export async function writeAudit(params: {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  await db.insert(schema.auditEvents).values({
    actorUserId: params.actorUserId ?? null,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId ?? null,
    reason: params.reason,
    metadata: params.metadata ?? {},
  });
}
