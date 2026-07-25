import type { Permission, Role } from "@/types/rbac";
import { ROLE_DEFINITIONS } from "@/lib/rbac/roles";

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_DEFINITIONS[role].permissions;
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  const rules: Array<{ prefix: string; permission: Permission }> = [
    { prefix: "/dashboard", permission: "dashboard:view" },
    { prefix: "/analytics", permission: "analytics:view" },
    { prefix: "/customers", permission: "customers:view" },
    { prefix: "/students", permission: "students:view" },
    { prefix: "/courses", permission: "courses:view" },
    { prefix: "/attendance", permission: "attendance:view" },
    { prefix: "/payments", permission: "payments:view" },
    { prefix: "/reports", permission: "reports:view" },
    { prefix: "/billing", permission: "billing:view" },
    { prefix: "/settings", permission: "settings:view" },
  ];

  const match = rules.find(
    (rule) =>
      pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );

  if (!match) return true;
  return hasPermission(role, match.permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}
