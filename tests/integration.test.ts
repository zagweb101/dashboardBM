import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "@/lib/security/temp-password";
import { validateFieldLengths, MAX_LENGTHS } from "@/lib/security/input";
import { isRole, parseRole } from "@/lib/rbac/guards";
import { hasPermission } from "@/lib/rbac/permissions";

describe("Student Validation (integration)", () => {
  it("should enforce all role guards are type-safe", () => {
    // Verify type guard works correctly
    const validRoles = ["owner", "admin", "manager", "employee", "viewer"];
    for (const role of validRoles) {
      expect(isRole(role)).toBe(true);
      expect(parseRole(role)).toBe(role);
    }

    const invalidRoles = ["superadmin", "god", "", "OWNER", "Admin"];
    for (const role of invalidRoles) {
      expect(isRole(role)).toBe(false);
    }
  });

  it("password + input validation should work together", () => {
    const pw = validatePasswordStrength("Strong1Pass");
    expect(pw.valid).toBe(true);

    const fields = validateFieldLengths([
      { value: "Test User", max: MAX_LENGTHS.name, name: "fullName" },
      { value: "test@test.com", max: MAX_LENGTHS.email, name: "email" },
    ]);
    expect(fields).toBeNull();
  });

  it("employee should have students:create but not students:delete", () => {
    expect(hasPermission("employee", "students:create")).toBe(true);
    expect(hasPermission("employee", "students:delete")).toBe(false);
  });

  it("manager should have courses:edit but not billing:manage", () => {
    expect(hasPermission("manager", "courses:edit")).toBe(true);
    expect(hasPermission("manager", "billing:manage")).toBe(false);
  });

  it("admin should have users:manage", () => {
    expect(hasPermission("admin", "users:manage")).toBe(true);
  });

  it("viewer should not have any :create, :edit, :delete, :manage permissions", () => {
    const dangerousPerms = [
      "students:create", "students:edit", "students:delete",
      "courses:edit", "courses:delete",
      "payments:create", "payments:edit", "payments:delete",
      "settings:manage", "users:manage", "organization:manage",
    ];
    for (const perm of dangerousPerms) {
      expect(hasPermission("viewer", perm as any)).toBe(false);
    }
  });
});
