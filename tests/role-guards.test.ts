import { describe, it, expect } from "vitest";
import { isRole, parseRole, assertValidRole } from "@/lib/rbac/guards";

describe("Role Guards", () => {
  describe("isRole", () => {
    it("should return true for valid roles", () => {
      expect(isRole("owner")).toBe(true);
      expect(isRole("admin")).toBe(true);
      expect(isRole("manager")).toBe(true);
      expect(isRole("employee")).toBe(true);
      expect(isRole("viewer")).toBe(true);
    });

    it("should return false for invalid strings", () => {
      expect(isRole("superadmin")).toBe(false);
      expect(isRole("OWNER")).toBe(false);
      expect(isRole("")).toBe(false);
      expect(isRole(null)).toBe(false);
      expect(isRole(undefined)).toBe(false);
    });
  });

  describe("parseRole", () => {
    it("should return Role for valid input", () => {
      expect(parseRole("owner")).toBe("owner");
      expect(parseRole("  admin  ")).toBe("admin");
    });

    it("should return null for invalid input", () => {
      expect(parseRole("superadmin")).toBeNull();
      expect(parseRole("")).toBeNull();
      expect(parseRole(null)).toBeNull();
    });
  });

  describe("assertValidRole", () => {
    it("should return the role if valid", () => {
      expect(assertValidRole("owner")).toBe("owner");
    });

    it("should throw if invalid", () => {
      expect(() => assertValidRole("invalid")).toThrow("Invalid role");
      expect(() => assertValidRole("")).toThrow("Invalid role");
    });
  });
});
