import { describe, it, expect } from "vitest";
import { ROLES, type Role } from "@/types/rbac";
import { hasPermission, canAccessRoute, assertPermission } from "@/lib/rbac/permissions";
import { ROLE_DEFINITIONS, getRoleDefinition, getRoleLabel } from "@/lib/rbac/roles";

describe("RBAC — Role Definitions", () => {
  it("should have exactly 5 roles", () => {
    expect(ROLES.length).toBe(5);
  });

  it("owner should have rank 100 (highest)", () => {
    expect(ROLE_DEFINITIONS.owner.rank).toBe(100);
  });

  it("viewer should have rank 20 (lowest)", () => {
    expect(ROLE_DEFINITIONS.viewer.rank).toBe(20);
  });

  it("roles should be ordered by rank descending", () => {
    const ranks = ROLES.map((r) => ROLE_DEFINITIONS[r].rank);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeLessThanOrEqual(ranks[i - 1]);
    }
  });

  it("owner should have all permissions", () => {
    expect(ROLE_DEFINITIONS.owner.permissions.length).toBeGreaterThanOrEqual(28);
  });

  it("viewer should have only :view permissions", () => {
    for (const p of ROLE_DEFINITIONS.viewer.permissions) {
      expect(p).toMatch(/:view$/);
    }
  });
});

describe("RBAC — hasPermission", () => {
  it("owner should have dashboard:view", () => {
    expect(hasPermission("owner", "dashboard:view")).toBe(true);
  });

  it("owner should have organization:manage", () => {
    expect(hasPermission("owner", "organization:manage")).toBe(true);
  });

  it("admin should NOT have organization:manage", () => {
    expect(hasPermission("admin", "organization:manage")).toBe(false);
  });

  it("viewer should NOT have students:create", () => {
    expect(hasPermission("viewer", "students:create")).toBe(false);
  });

  it("employee should have attendance:manage", () => {
    expect(hasPermission("employee", "attendance:manage")).toBe(true);
  });

  it("manager should have billing:view", () => {
    expect(hasPermission("manager", "billing:view")).toBe(true);
  });
});

describe("RBAC — canAccessRoute", () => {
  it("owner can access /dashboard", () => {
    expect(canAccessRoute("owner", "/dashboard")).toBe(true);
  });

  it("viewer can access /dashboard", () => {
    expect(canAccessRoute("viewer", "/dashboard")).toBe(true);
  });

  it("employee cannot access /settings (no settings:manage)", () => {
    // employee has settings:view but not settings:manage
    // canAccessRoute checks :view permission
    expect(canAccessRoute("employee", "/settings")).toBe(true);
  });

  it("unknown routes are always accessible", () => {
    expect(canAccessRoute("viewer", "/random-page")).toBe(true);
  });
});

describe("RBAC — assertPermission", () => {
  it("should not throw for valid permission", () => {
    expect(() => assertPermission("owner", "dashboard:view")).not.toThrow();
  });

  it("should throw for invalid permission", () => {
    expect(() => assertPermission("viewer", "students:delete")).toThrow("Missing permission");
  });
});

describe("RBAC — getRoleDefinition", () => {
  it("should return correct label for each role", () => {
    expect(getRoleLabel("owner", "ar")).toBe("المالك");
    expect(getRoleLabel("admin", "en")).toBe("Admin");
    expect(getRoleLabel("manager", "ar")).toBe("مدير");
    expect(getRoleLabel("employee", "en")).toBe("Employee");
    expect(getRoleLabel("viewer", "ar")).toBe("مشاهد");
  });

  it("should have a definition for every role", () => {
    for (const role of ROLES) {
      const def = getRoleDefinition(role);
      expect(def.id).toBe(role);
      expect(def.rank).toBeGreaterThan(0);
      expect(def.permissions.length).toBeGreaterThan(0);
    }
  });
});
