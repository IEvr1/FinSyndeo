import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

export const neonAuth =
  baseUrl && cookieSecret
    ? createNeonAuth({
        baseUrl,
        cookies: { secret: cookieSecret },
      })
    : null;

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  mfaEnabled?: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!neonAuth) return null;
  try {
    const { data } = await neonAuth.getSession();
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      emailVerified: data.user.emailVerified ?? false,
    };
  } catch {
    return null;
  }
}

export function authConfigured(): boolean {
  return Boolean(neonAuth);
}
