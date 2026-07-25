"use server";

/**
 * Server Actions — صفحة الإعدادات
 * الملف الشخصي · الفريق · الأمان
 */
import { revalidatePath } from "next/cache";
import { requirePermission, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { type Role } from "@/types/rbac";
import type { ThemePreference } from "@/types/database";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRoleDefinition } from "@/lib/rbac/roles";
import { assertValidRole, parseRole } from "@/lib/rbac/guards";
import { MAX_LENGTHS, validateFieldLengths } from "@/lib/security/input";

export type SettingsActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  temporaryPassword?: string;
};

type Locale = "ar" | "en";

function loc(user: { locale?: string }): Locale {
  return user.locale === "en" ? "en" : "ar";
}

function msg(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

// ── 1) الملف الشخصي ───────────────────────────────────────────────────

export async function updateProfileAction(
  _prev: SettingsActionState | null,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requireUser();
  const locale = loc(user);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const prefLocale = String(formData.get("locale") ?? user.locale).trim();
  const theme = String(formData.get("theme") ?? user.theme ?? "system").trim();

  const fieldErrors: Record<string, string> = {};

  const lengthError = validateFieldLengths([
    { value: fullName, max: MAX_LENGTHS.name, name: "fullName" },
    { value: email, max: MAX_LENGTHS.email, name: "email" },
    { value: phone, max: MAX_LENGTHS.phone, name: "phone" },
    { value: avatarUrl, max: MAX_LENGTHS.url, name: "avatarUrl" },
  ]);
  if (lengthError) {
    fieldErrors.fullName = msg(locale, "الحقل طويل جداً", lengthError);
  }
  if (fullName.length < 2) {
    fieldErrors.fullName = msg(locale, "الاسم قصير جداً", "Name is too short");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = msg(locale, "بريد غير صالح", "Invalid email");
  }
  if (prefLocale !== "ar" && prefLocale !== "en") {
    fieldErrors.locale = msg(locale, "لغة غير صالحة", "Invalid locale");
  }
  if (!["light", "dark", "system"].includes(theme)) {
    fieldErrors.theme = msg(locale, "مظهر غير صالح", "Invalid theme");
  }

  if (Object.keys(fieldErrors).length) {
    return {
      success: false,
      error: msg(locale, "صحّح الحقول", "Fix the highlighted fields"),
      fieldErrors,
    };
  }

  try {
    await db.updateProfile(user.id, {
      fullName,
      email: email || user.email,
      phone: phone || undefined,
      avatarUrl: avatarUrl || null,
      locale: prefLocale as "ar" | "en",
      theme: theme as ThemePreference,
    });
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return {
      success: true,
      message: msg(locale, "تم حفظ الملف الشخصي", "Profile saved"),
    };
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_EXISTS") {
      return {
        success: false,
        error: msg(locale, "البريد مستخدم مسبقاً", "Email already in use"),
        fieldErrors: {
          email: msg(locale, "البريد مستخدم مسبقاً", "Email already in use"),
        },
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : msg(locale, "فشل الحفظ", "Save failed"),
    };
  }
}

// ── 2) الفريق ──────────────────────────────────────────────────────────

export async function inviteMemberAction(
  _prev: SettingsActionState | null,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requirePermission("users:manage");
  const locale = loc(user);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleStr = String(formData.get("role") ?? "employee").trim();

  if (fullName.length < 2 || !email) {
    return {
      success: false,
      error: msg(locale, "الاسم والبريد مطلوبان", "Name and email are required"),
    };
  }

  let role: Role;
  try {
    role = assertValidRole(roleStr);
  } catch {
    return {
      success: false,
      error: msg(locale, "الدور غير صالح", "Invalid role"),
    };
  }
  if (role === "owner") {
    return {
      success: false,
      error: msg(locale, "لا يمكن تعيين دور المالك من هنا", "Cannot assign Owner role here"),
    };
  }

  const lengthError = validateFieldLengths([
    { value: fullName, max: MAX_LENGTHS.name, name: "fullName" },
    { value: email, max: MAX_LENGTHS.email, name: "email" },
  ]);
  if (lengthError) {
    return { success: false, error: msg(locale, "الحقل طويل جداً", lengthError) };
  }

  // لا يُسمح بتعيين دور أعلى منك
  const actorRank = getRoleDefinition(user.role).rank;
  const targetRank = getRoleDefinition(role).rank;
  if (targetRank >= actorRank && user.role !== "owner") {
    return {
      success: false,
      error: msg(
        locale,
        "لا يمكنك تعيين دور مساوٍ أو أعلى من دورك",
        "You cannot assign a role equal or higher than yours",
      ),
    };
  }

  try {
    const { generateTempPassword } = await import("@/lib/security/temp-password");
    const temp = generateTempPassword();
    await db.inviteTeamMember(user.organizationId, {
      fullName,
      email,
      role,
      temporaryPassword: temp,
    });
    revalidatePath("/settings");
    return {
      success: true,
      message: msg(
        locale,
        `تمت إضافة العضو. كلمة المرور المؤقتة: ${temp}`,
        `Member added. Temporary password: ${temp}`,
      ),
      temporaryPassword: temp,
    };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "EMAIL_EXISTS") {
      return {
        success: false,
        error: msg(locale, "البريد مسجّل مسبقاً", "Email already registered"),
      };
    }
    if (code === "CANNOT_ASSIGN_OWNER") {
      return {
        success: false,
        error: msg(locale, "لا يمكن تعيين Owner", "Cannot assign Owner"),
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function updateMemberRoleAction(
  memberId: string,
  role: string,
): Promise<SettingsActionState> {
  const user = await requirePermission("users:manage");
  const locale = loc(user);

  const nextRole = parseRole(role);
  if (!nextRole) {
    return { success: false, error: msg(locale, "دور غير صالح", "Invalid role") };
  }
  if (nextRole === "owner" && user.role !== "owner") {
    return {
      success: false,
      error: msg(locale, "فقط المالك يعيّن مالكاً", "Only an owner can assign Owner"),
    };
  }

  if (memberId === user.id && nextRole !== "owner" && user.role === "owner") {
    // منع تخفيض آخر owner يُعالج في DB
  }

  try {
    await db.updateMemberRole(
      user.organizationId,
      memberId,
      nextRole,
      user.id,
    );
    revalidatePath("/settings");
    return {
      success: true,
      message: msg(locale, "تم تحديث الدور", "Role updated"),
    };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "LAST_OWNER") {
      return {
        success: false,
        error: msg(
          locale,
          "لا يمكن إزالة/تخفيض المالك الوحيد",
          "Cannot demote the only owner",
        ),
      };
    }
    if (code === "CANNOT_ASSIGN_OWNER") {
      return {
        success: false,
        error: msg(locale, "غير مسموح", "Not allowed"),
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function removeMemberAction(
  memberId: string,
): Promise<SettingsActionState> {
  const user = await requirePermission("users:manage");
  const locale = loc(user);

  if (memberId === user.id) {
    return {
      success: false,
      error: msg(locale, "لا يمكنك إزالة نفسك", "You cannot remove yourself"),
    };
  }

  try {
    await db.removeTeamMember(user.organizationId, memberId, user.id);
    revalidatePath("/settings");
    return {
      success: true,
      message: msg(locale, "تمت إزالة العضو", "Member removed"),
    };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "CANNOT_REMOVE_SELF") {
      return {
        success: false,
        error: msg(locale, "لا يمكنك إزالة نفسك", "You cannot remove yourself"),
      };
    }
    if (code === "LAST_OWNER") {
      return {
        success: false,
        error: msg(
          locale,
          "لا يمكن حذف المالك الوحيد",
          "Cannot remove the only owner",
        ),
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

// ── 3) الأمان ──────────────────────────────────────────────────────────

export async function changePasswordAction(
  _prev: SettingsActionState | null,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requireUser();
  const locale = loc(user);

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return {
      success: false,
      error: msg(
        locale,
        "كلمة المرور الجديدة 8 أحرف على الأقل",
        "New password must be at least 8 characters",
      ),
    };
  }
  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: msg(locale, "كلمتا المرور غير متطابقتين", "Passwords do not match"),
    };
  }

  try {
    await db.changePassword(user.id, currentPassword, newPassword);
    return {
      success: true,
      message: msg(locale, "تم تحديث كلمة المرور", "Password updated"),
    };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "INVALID_PASSWORD") {
      return {
        success: false,
        error: msg(
          locale,
          "كلمة المرور الحالية غير صحيحة",
          "Current password is incorrect",
        ),
      };
    }
    if (code === "WEAK_PASSWORD") {
      return {
        success: false,
        error: msg(locale, "كلمة مرور ضعيفة", "Weak password"),
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

/** هل يمكن للمستخدم إدارة الفريق؟ */
export async function canManageTeamFlag(): Promise<boolean> {
  const user = await requireUser();
  return hasPermission(user.role, "users:manage");
}
