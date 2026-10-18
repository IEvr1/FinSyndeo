import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { neonAuth, authConfigured } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { validatePasswordForRegistration } from "@/lib/password-policy";

export async function POST(request: Request) {
  const { token, password } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  }

  const check = await validatePasswordForRegistration(password);
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: 400 });
  }

  if (authConfigured() && neonAuth && "resetPassword" in neonAuth) {
    const reset = neonAuth.resetPassword as (args: {
      newPassword: string;
      token: string;
    }) => Promise<{ error?: { message: string } }>;
    const { error } = await reset({ newPassword: password, token });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Password reset is not configured." }, { status: 503 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = getDb();
  const rows = await db.select().from(schema.platformSettings);
  const match = rows.find((row) => {
    const key = String(row.key);
    if (!key.startsWith("password_reset:")) return false;
    const value = row.value as { tokenHash?: string; expiresAt?: number };
    return value.tokenHash === tokenHash && typeof value.expiresAt === "number" && value.expiresAt > Date.now();
  });

  if (!match) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await db.delete(schema.platformSettings).where(eq(schema.platformSettings.id, match.id));

  return NextResponse.json({
    ok: true,
    notice: "Password accepted. Configure Neon Auth for production password resets.",
  });
}
