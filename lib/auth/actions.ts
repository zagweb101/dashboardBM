"use server";

/**
 * Server Actions للمصادقة عبر Auth.js + Postgres
 */
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { randomBytes } from "crypto";
import { signIn, signOut } from "@/auth";
import type { AuthResult } from "@/types/auth";
import { authMessage, type AuthLocale } from "@/lib/auth/messages";
import {
  generateResetToken,
  hashPassword,
  hashToken,
} from "@/lib/auth/password";
import {
  clientQuery,
  isDatabaseConfigured,
  query,
  queryOne,
  withTransaction,
} from "@/lib/db/postgres";

function localeFromForm(formData: FormData): AuthLocale {
  const l = String(formData.get("locale") ?? "ar");
  return l === "en" ? "en" : "ar";
}

function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `org-${randomBytes(3).toString("hex")}`
  );
}

// ── Login ──────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const locale = localeFromForm(formData);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard") || "/dashboard";

  if (!email || !password) {
    return { success: false, error: authMessage("requiredFields", locale) };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: next.startsWith("/") ? next : "/dashboard",
    });
    // signIn يوجّه تلقائياً عند النجاح
    return { success: true };
  } catch (error) {
    // Next.js redirect يُرمى كاستثناء — نعيد رميه
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    if (error instanceof AuthError) {
      return {
        success: false,
        error: authMessage("invalidCredentials", locale),
      };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : authMessage("loginFailed", locale),
    };
  }
}

// ── Register ───────────────────────────────────────────────────────────

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const locale = localeFromForm(formData);
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const organizationName = String(
    formData.get("organizationName") ?? "",
  ).trim();

  if (!fullName || !email || password.length < 8) {
    return {
      success: false,
      error: authMessage("registerValidation", locale),
    };
  }

  // بدون Postgres: سجّل دخول demo (تطوير)
  if (!isDatabaseConfigured()) {
    try {
      await signIn("credentials", {
        email: "owner@example.com",
        password: "password123",
        redirectTo: "/dashboard",
      });
      return { success: true };
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      return {
        success: false,
        error: authMessage("dbRequired", locale),
      };
    }
  }

  try {
    const existing = await queryOne(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [email],
    );
    if (existing) {
      return { success: false, error: authMessage("emailExists", locale) };
    }

    const passwordHash = await hashPassword(password);
    const userId = `user_${randomBytes(8).toString("hex")}`;
    const orgId = `org_${randomBytes(6).toString("hex")}`;
    const orgName = organizationName || `${fullName} — مركز`;
    const slug = `${slugify(orgName)}-${randomBytes(2).toString("hex")}`;
    // الدور الافتراضي للتسجيل الذاتي
    const defaultRole = "employee";

    await withTransaction(async (client) => {
      await clientQuery(
        client,
        `
        INSERT INTO organizations (id, name, slug, owner_id)
        VALUES ($1, $2, $3, $4)
        `,
        [orgId, orgName, slug, userId],
      );

      await clientQuery(
        client,
        `
        INSERT INTO users (
          id, name, email, "emailVerified", password_hash,
          role, organization_id, locale
        ) VALUES ($1, $2, $3, now(), $4, $5, $6, $7)
        `,
        [userId, fullName, email, passwordHash, defaultRole, orgId, locale],
      );

      await clientQuery(
        client,
        `
        INSERT INTO profiles (
          id, email, full_name, role, organization_id, locale
        ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [userId, email, fullName, defaultRole, orgId, locale],
      );

      await clientQuery(
        client,
        `
        INSERT INTO accounts (id, "userId", type, provider, "providerAccountId")
        VALUES ($1, $2, 'credentials', 'credentials', $3)
        `,
        [`acc_${userId}`, userId, email],
      );
    });

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth] register:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : authMessage("registerFailed", locale),
    };
  }
}

// ── Forgot / Reset password ────────────────────────────────────────────

export async function forgotPasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const locale = localeFromForm(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { success: false, error: authMessage("emailRequired", locale) };
  }

  // لا نفصح عن وجود الحساب
  if (!isDatabaseConfigured()) {
    return { success: true };
  }

  try {
    const user = await queryOne(`SELECT id, email FROM users WHERE lower(email) = lower($1)`, [
      email,
    ]);
    if (user) {
      const { raw, hashed } = generateResetToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // ساعة

      // احذف رموز سابقة لنفس البريد
      await query(
        `DELETE FROM verification_token WHERE identifier = $1`,
        [email],
      );
      await query(
        `
        INSERT INTO verification_token (identifier, token, expires)
        VALUES ($1, $2, $3)
        `,
        [email, hashed, expires.toISOString()],
      );

      // في الإنتاج: أرسل بريداً. للتطوير: اطبع الرابط
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;
      console.info("[auth] reset link:", resetUrl);

      // أعد token في وضع التطوير فقط لمساعدة الاختبار
      if (process.env.NODE_ENV !== "production") {
        return {
          success: true,
          redirectTo: `/reset-password?token=${raw}&email=${encodeURIComponent(email)}`,
        };
      }
    }
    return { success: true };
  } catch (error) {
    console.error("[auth] forgot:", error);
    return { success: true }; // لا نفصح عن الأخطاء
  }
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const locale = localeFromForm(formData);
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (password.length < 8) {
    return { success: false, error: authMessage("passwordTooShort", locale) };
  }
  if (password !== confirm) {
    return { success: false, error: authMessage("passwordMismatch", locale) };
  }

  if (!isDatabaseConfigured()) {
    return { success: true, redirectTo: "/login" };
  }

  if (!token || !email) {
    return {
      success: false,
      error: authMessage("invalidResetToken", locale),
    };
  }

  try {
    const hashed = hashToken(token);
    const row = await queryOne<{ identifier: string; expires: Date | string }>(
      `
      SELECT identifier, expires FROM verification_token
      WHERE identifier = $1 AND token = $2
      LIMIT 1
      `,
      [email, hashed],
    );

    if (!row) {
      return {
        success: false,
        error: authMessage("invalidResetToken", locale),
      };
    }

    const exp =
      row.expires instanceof Date
        ? row.expires.getTime()
        : new Date(row.expires).getTime();
    if (exp < Date.now()) {
      await query(
        `DELETE FROM verification_token WHERE identifier = $1 AND token = $2`,
        [email, hashed],
      );
      return {
        success: false,
        error: authMessage("invalidResetToken", locale),
      };
    }

    const passwordHash = await hashPassword(password);
    await query(
      `UPDATE users SET password_hash = $2 WHERE lower(email) = lower($1)`,
      [email, passwordHash],
    );
    await query(
      `DELETE FROM verification_token WHERE identifier = $1`,
      [email],
    );

    return { success: true, redirectTo: "/login" };
  } catch (error) {
    console.error("[auth] reset:", error);
    return {
      success: false,
      error: authMessage("invalidResetToken", locale),
    };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
