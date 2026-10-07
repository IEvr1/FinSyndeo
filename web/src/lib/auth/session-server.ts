import { cookies } from "next/headers";
import { getSessionUser, authConfigured } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

const DEV_COOKIE = "finsyndeo_dev_session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (authConfigured()) {
    return getSessionUser();
  }
  const jar = await cookies();
  const raw = jar.get(DEV_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    return { ...parsed, mfaEnabled: parsed.mfaEnabled ?? false };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }
  return user;
}
