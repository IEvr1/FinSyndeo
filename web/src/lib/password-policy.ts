import { createHash } from "crypto";

export type PasswordValidation = { ok: true } | { ok: false; message: string };

/**
 * Business password floor (registration, change, reset): min 8 chars with upper,
 * lower, digit and symbol. No truncation. Enforce on UI and server.
 *
 * Security design note: this floor is not a security certification. Admin access
 * must use MFA (`users.mfaEnabled`); login attempts are rate-limited; compromised
 * passwords are blocked via HIBP when available.
 */
export function validatePassword(password: string): PasswordValidation {
  if (typeof password !== "string") {
    return { ok: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, message: "Password must include at least one lowercase letter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, message: "Password must include at least one uppercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: "Password must include at least one number." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, message: "Password must include at least one symbol." };
  }
  return { ok: true };
}

/** k-anonymity check against Have I Been Pwned (optional; set PASSWORD_HIBP_CHECK=false to skip). */
export async function assertPasswordNotCompromised(password: string): Promise<PasswordValidation> {
  if (process.env.PASSWORD_HIBP_CHECK === "false") return { ok: true };
  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: true };
    const body = await res.text();
    const pwned = body.split("\n").some((line) => line.startsWith(`${suffix}:`));
    if (pwned) {
      return {
        ok: false,
        message: "This password has appeared in a known data breach. Choose a different password.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function validatePasswordForRegistration(password: string): Promise<PasswordValidation> {
  const basic = validatePassword(password);
  if (!basic.ok) return basic;
  return assertPasswordNotCompromised(password);
}
