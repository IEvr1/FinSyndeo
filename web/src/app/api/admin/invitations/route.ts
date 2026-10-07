import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, assertAdmin } from "@/lib/permissions";
import { getDb, schema } from "@/lib/db";

/** Invitation-only introducer and admin access. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await loadAuthContext(user);
  assertAdmin(ctx);

  if (!user.mfaEnabled && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Admin MFA required." }, { status: 403 });
  }

  const { email, name, role } = await request.json();
  if (!["introducer", "admin"].includes(role)) {
    return NextResponse.json({ error: "Only introducer and admin invitations allowed." }, { status: 400 });
  }

  const db = getDb();
  const [newUser] = await db
    .insert(schema.users)
    .values({ email, name, emailVerified: false, mfaEnabled: role === "admin" })
    .onConflictDoNothing()
    .returning();

  if (!newUser) {
    return NextResponse.json({ error: "User already exists." }, { status: 409 });
  }

  let introducerId: string | null = null;
  if (role === "introducer") {
    const [intro] = await db
      .insert(schema.introducers)
      .values({
        userId: newUser.id,
        displayName: name,
        email,
        status: "invited",
        referralToken: randomBytes(16).toString("hex"),
      })
      .returning();
    introducerId = intro.id;
  }

  await db.insert(schema.memberships).values({
    userId: newUser.id,
    role: role as "introducer" | "admin",
    introducerId,
    invited: true,
  });

  return NextResponse.json({ invited: true, userId: newUser.id });
}
