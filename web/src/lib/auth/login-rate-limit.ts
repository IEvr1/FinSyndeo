import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const LOCK_MS = 30 * 60 * 1000;

function settingsKey(email: string) {
  return `login_rate:${email.trim().toLowerCase()}`;
}

type RateState = { count: number; windowStart: number; lockedUntil?: number };

async function readState(email: string): Promise<RateState> {
  const db = getDb();
  const key = settingsKey(email);
  const [row] = await db
    .select()
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.key, key))
    .limit(1);
  if (!row) return { count: 0, windowStart: Date.now() };
  return row.value as RateState;
}

async function writeState(email: string, state: RateState) {
  const db = getDb();
  const key = settingsKey(email);
  const [existing] = await db
    .select({ id: schema.platformSettings.id })
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.key, key))
    .limit(1);
  if (existing) {
    await db
      .update(schema.platformSettings)
      .set({ value: state, updatedAt: new Date() })
      .where(eq(schema.platformSettings.id, existing.id));
  } else {
    await db.insert(schema.platformSettings).values({ key, value: state });
  }
}

export async function assertLoginAllowed(email: string): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const now = Date.now();
  const state = await readState(email);
  if (state.lockedUntil && state.lockedUntil > now) {
    return {
      allowed: false,
      message: "Too many sign-in attempts. Try again later or reset your password.",
    };
  }
  if (now - state.windowStart > WINDOW_MS) {
    await writeState(email, { count: 0, windowStart: now });
  }
  return { allowed: true };
}

export async function recordFailedLogin(email: string): Promise<void> {
  const now = Date.now();
  let state = await readState(email);
  if (now - state.windowStart > WINDOW_MS) {
    state = { count: 0, windowStart: now };
  }
  state.count += 1;
  if (state.count >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCK_MS;
    state.count = 0;
    state.windowStart = now;
  }
  await writeState(email, state);
}

export async function clearLoginAttempts(email: string): Promise<void> {
  const db = getDb();
  await db.delete(schema.platformSettings).where(eq(schema.platformSettings.key, settingsKey(email)));
}
