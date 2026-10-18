import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { neonAuth, authConfigured } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/integrations";

const GENERIC_OK =
  "If an account exists for that email, you will receive password reset instructions shortly.";

function appOrigin(request: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  return new URL(request.url).origin;
}

async function storeDevResetToken(email: string, token: string) {
  if (!process.env.DATABASE_URL) return;
  const db = getDb();
  const key = `password_reset:${email.trim().toLowerCase()}`;
  const value = {
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
  const [existing] = await db
    .select({ id: schema.platformSettings.id })
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.key, key))
    .limit(1);
  if (existing) {
    await db
      .update(schema.platformSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.platformSettings.id, existing.id));
  } else {
    await db.insert(schema.platformSettings).values({ key, value });
  }
}

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const redirectTo = `${appOrigin(request)}/auth/reset-password`;

  if (authConfigured() && neonAuth && "requestPasswordReset" in neonAuth) {
    const requestReset = neonAuth.requestPasswordReset as (args: {
      email: string;
      redirectTo?: string;
    }) => Promise<{ error?: { message: string } }>;
    const { error } = await requestReset({ email: email.trim(), redirectTo });
    if (error) {
      // Avoid account enumeration; still return generic success for unknown emails when possible.
      return NextResponse.json({ ok: true, message: GENERIC_OK });
    }
    return NextResponse.json({ ok: true, message: GENERIC_OK });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, message: GENERIC_OK });
  }

  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const candidates = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users);
  const user = candidates.find((u) => u.email.trim().toLowerCase() === normalized);

  if (user) {
    const token = randomBytes(32).toString("hex");
    await storeDevResetToken(user.email, token);
    const resetUrl = `${redirectTo}?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: [user.email],
      subject: "Reset your FinSyndeo password",
      html: `<p>Use this link to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      idempotencyKey: `password-reset:${user.id}:${Date.now()}`,
    });
  }

  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
