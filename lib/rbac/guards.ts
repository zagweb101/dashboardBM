import { ROLES, type Role } from "@/types/rbac";

/** Runtime type guard: is the string a valid Role? */
export function isRole(value: string | null | undefined): value is Role {
  return (ROLES as readonly string[]).includes(value ?? "");
}

/** Parse a role from arbitrary input, returns null if invalid */
export function parseRole(value: unknown): Role | null {
  const str = String(value ?? "").trim();
  return isRole(str) ? str : null;
}

/** Assert role is valid or throw */
export function assertValidRole(value: unknown, label = "role"): Role {
  const role = parseRole(value);
  if (!role) {
    throw new Error(`Invalid ${label}: ${String(value)}`);
  }
  return role;
}
