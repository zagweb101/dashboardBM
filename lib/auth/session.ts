/**
 * جلسة التطبيق — Auth.js + تحديث من profiles في DB
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AuthUser } from "@/types/auth";
import type { Permission } from "@/types/rbac";
import { hasPermission } from "@/lib/rbac/permissions";
import { getInitials } from "@/lib/utils";
import { db } from "@/lib/db";
import { enrichProfile } from "@/lib/auth/mappers";

/** يفضّل قراءة الـ profile من DB (بيانات حديثة بعد /settings) */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email) return null;

  try {
    const profile = await db.getProfileById(u.id);
    if (profile) {
      return enrichProfile(profile);
    }
  } catch {
    /* fallback JWT */
  }

  const fullName = u.fullName || u.name || u.email.split("@")[0];
  return {
    id: u.id,
    email: u.email,
    fullName,
    phone: u.phone,
    avatarUrl: u.image ?? null,
    avatarInitials: getInitials(fullName),
    role: u.role ?? "viewer",
    organizationId: u.organizationId ?? "",
    organizationName: u.organizationName ?? "بيت المصور",
    locale: u.locale === "en" ? "en" : "ar",
    theme: u.theme ?? "system",
    createdAt: new Date().toISOString(),
  };
}

export async function requireUser(redirectTo = "/login"): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requirePermission(
  permission: Permission,
  redirectTo = "/dashboard",
): Promise<AuthUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    redirect(redirectTo);
  }
  return user;
}
