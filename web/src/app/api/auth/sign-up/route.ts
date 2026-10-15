import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neonAuth, authConfigured } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { validatePasswordForRegistration } from "@/lib/password-policy";

export async function POST(request: Request) {
  const { email, password, name, role } = await request.json();

  const pwCheck = await validatePasswordForRegistration(password);
  if (!pwCheck.ok) {
    return NextResponse.json({ error: pwCheck.message }, { status: 400 });
  }

  if (!["applicant", "provider"].includes(role)) {
    return NextResponse.json(
      { error: "Only applicant and provider registration is public." },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  const db = getDb();
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  if (authConfigured() && neonAuth) {
    const { error } = await neonAuth.signUp.email({ email, password, name });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const [user] = await db
    .insert(schema.users)
    .values({ email, name, emailVerified: !authConfigured() })
    .returning();

  let providerId: string | null = null;
  if (role === "provider") {
    const [provider] = await db
      .insert(schema.providers)
      .values({
        code: "P-" + user.id.slice(0, 8).toUpperCase(),
        legalName: name,
        country: "Pending",
      })
      .returning();
    providerId = provider.id;
  }

  await db.insert(schema.memberships).values({
    userId: user.id,
    role: role as "applicant" | "provider",
    providerId,
    invited: false,
  });

  if (!authConfigured()) {
    const jar = await cookies();
    jar.set("finsyndeo_dev_session", JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    }), { httpOnly: true, sameSite: "lax", path: "/" });
  }

  return NextResponse.json({
    redirect: role === "provider" ? "/provider" : "/applicant",
  });
}
