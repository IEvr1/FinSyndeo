import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { ProviderDraftState } from "./types";

function parseLaunchMonthYear(launch: string): Date | null {
  const m = launch.trim().match(/^(\d{1,2})\s*[/\-.]\s*(\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return new Date(year, month, 0);
}

export async function syncProviderPlannedItems(providerId: string, state: ProviderDraftState) {
  if (!process.env.DATABASE_URL) return;
  const db = getDb();
  const now = new Date();

  await db.delete(schema.providerPlannedItems).where(eq(schema.providerPlannedItems.providerId, providerId));

  const rows: Array<typeof schema.providerPlannedItems.$inferInsert> = [];
  for (const offer of state.offers) {
    const planned = (offer.data.planned as Array<Record<string, string>> | undefined) ?? [];
    for (const entry of planned) {
      const name = String(entry.name ?? "").trim();
      if (!name) continue;
      const launch = String(entry.launch ?? "").trim();
      const target = parseLaunchMonthYear(launch);
      const overdue = target && target < now;
      rows.push({
        providerId,
        offerFamily: offer.family,
        itemName: name,
        launchTarget: launch || null,
        comment: String(entry.comment ?? "").trim() || null,
        status: "planned",
        overdueFlaggedAt: overdue ? now : null,
      });
    }
  }

  if (rows.length) {
    await db.insert(schema.providerPlannedItems).values(rows);
  }
}

export async function sendPlannedReminders(providerId: string) {
  if (!process.env.DATABASE_URL) return;
  const db = getDb();
  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const items = await db
    .select()
    .from(schema.providerPlannedItems)
    .where(eq(schema.providerPlannedItems.providerId, providerId));

  for (const item of items) {
    if (!item.launchTarget) continue;
    const target = parseLaunchMonthYear(item.launchTarget);
    if (!target) continue;
    const dueSoon = target <= inThirtyDays && target >= now;
    const overdue = target < now;
    if ((dueSoon || overdue) && !item.reminderSentAt) {
      await db.insert(schema.auditEvents).values({
        action: "provider_planned_reminder",
        resourceType: "provider_planned_item",
        resourceId: item.id,
        metadata: { providerId, itemName: item.itemName, launchTarget: item.launchTarget, overdue },
      });
      await db
        .update(schema.providerPlannedItems)
        .set({
          reminderSentAt: now,
          overdueFlaggedAt: overdue ? now : item.overdueFlaggedAt,
        })
        .where(eq(schema.providerPlannedItems.id, item.id));
    }
  }
}
