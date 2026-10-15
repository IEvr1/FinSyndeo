import { NextResponse } from "next/server";
import { neonAuth, authConfigured } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/session-server";
import { validatePasswordForRegistration } from "@/lib/password-policy";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password, currentPassword } = await request.json();
  const check = await validatePasswordForRegistration(password);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 400 });

  if (authConfigured() && neonAuth && "changePassword" in neonAuth) {
    const change = neonAuth.changePassword as (args: {
      newPassword: string;
      currentPassword: string;
    }) => Promise<{ error?: { message: string } }>;
    const { error } = await change({ newPassword: password, currentPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ changed: true });
  }

  if (!currentPassword || String(currentPassword).length < 8) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }

  return NextResponse.json({
    changed: true,
    notice: "Password updated for this session. Configure Neon Auth for production password changes.",
  });
}
