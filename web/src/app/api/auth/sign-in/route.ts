import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neonAuth, authConfigured } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { assertLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/login-rate-limit";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (process.env.DATABASE_URL) {
    const gate = await assertLoginAllowed(email);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.message }, { status: 429 });
    }
  }

  if (authConfigured() && neonAuth) {
    const { error } = await neonAuth.signIn.email({ email, password });
    if (error) {
      if (process.env.DATABASE_URL) await recordFailedLogin(email);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (process.env.DATABASE_URL) await clearLoginAttempts(email);
    const db = getDb();
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const redirect = user ? await roleRedirect(user.id) : "/";
    return NextResponse.json({ redirect });
  }

  // Dev fallback when Neon Auth not configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL and Neon Auth must be configured for production." },
      { status: 503 }
    );
  }

  const db = getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    if (process.env.DATABASE_URL) await recordFailedLogin(email);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  if (password.length < 8) {
    if (process.env.DATABASE_URL) await recordFailedLogin(email);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  if (process.env.DATABASE_URL) await clearLoginAttempts(email);
  const jar = await cookies();
  jar.set("finsyndeo_dev_session", JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
  }), { httpOnly: true, sameSite: "lax", path: "/" });

  const redirect = await roleRedirect(user.id);
  return NextResponse.json({ redirect });
}

async function roleRedirect(userId: string): Promise<string> {
  const db = getDb();
  const memberships = await db
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .where(eq(schema.memberships.userId, userId));

  if (memberships.some((m) => m.role === "admin")) return "/admin";
  if (memberships.some((m) => m.role === "provider")) return "/provider";
  if (memberships.some((m) => m.role === "introducer")) return "/introducer";
  return "/applicant";
}
