import { describe, it, expect } from "vitest";
import { canAccessDocument } from "@/lib/permissions";
import type { AuthContext } from "@/lib/permissions";

const providerCtx: AuthContext = {
  user: { id: "1", email: "p@example.com", emailVerified: true },
  memberships: [{ id: "m1", role: "provider", providerId: "p1", introducerId: null }],
};

const adminCtx: AuthContext = {
  user: { id: "2", email: "a@example.com", emailVerified: true },
  memberships: [{ id: "m2", role: "admin", providerId: null, introducerId: null }],
};

describe("document classification access", () => {
  it("provider cannot access internal DD report", () => {
    expect(canAccessDocument(providerCtx, "internal_dd_report", "application", "a1")).toBe(false);
  });

  it("admin can access internal DD report", () => {
    expect(canAccessDocument(adminCtx, "internal_dd_report", "application", "a1")).toBe(true);
  });

  it("provider can access institution profile", () => {
    expect(canAccessDocument(providerCtx, "institution_profile", "application", "a1")).toBe(true);
  });
});
