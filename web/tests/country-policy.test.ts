import { describe, it, expect, beforeEach } from "vitest";
import {
  setActiveCountryPolicy,
  validateCountrySelection,
  getSelectableCountries,
} from "@/lib/country-policy";

describe("country policy two-group", () => {
  beforeEach(() => {
    setActiveCountryPolicy({ version: 1, group1Exclusions: ["Russia", "Iran"], published: true });
  });

  it("rejects excluded Group 1 countries", () => {
    const result = validateCountrySelection("group1", ["Cyprus", "Russia"]);
    expect(result.valid).toBe(false);
    expect(result.rejected).toContain("Russia");
  });

  it("allows all countries in Group 2", () => {
    const selectable = getSelectableCountries("group2");
    expect(selectable).toContain("Russia");
    expect(selectable).toContain("Iran");
  });

  it("does not auto-load sample as default production policy", () => {
    setActiveCountryPolicy({ version: 0, group1Exclusions: [], published: false });
    expect(getSelectableCountries("group1")).not.toEqual([]);
  });
});
