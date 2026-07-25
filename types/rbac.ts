export const ROLES = [
  "owner",
  "admin",
  "manager",
  "employee",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "analytics:view",
  "analytics:export",
  "customers:view",
  "customers:create",
  "customers:edit",
  "customers:delete",
  "students:view",
  "students:create",
  "students:edit",
  "students:delete",
  "courses:view",
  "courses:create",
  "courses:edit",
  "courses:delete",
  "attendance:view",
  "attendance:manage",
  "payments:view",
  "payments:create",
  "payments:edit",
  "payments:delete",
  "reports:view",
  "reports:export",
  "billing:view",
  "billing:manage",
  "settings:view",
  "settings:manage",
  "users:view",
  "users:manage",
  "organization:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type RoleDefinition = {
  id: Role;
  rank: number;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  permissions: Permission[];
};
