/**
 * رسائل أخطاء المصادقة عربي / إنجليزي
 */
export type AuthLocale = "ar" | "en";

const messages = {
  requiredFields: {
    ar: "البريد وكلمة المرور مطلوبان",
    en: "Email and password are required",
  },
  invalidCredentials: {
    ar: "بيانات الدخول غير صحيحة",
    en: "Invalid email or password",
  },
  registerValidation: {
    ar: "أدخل الاسم والبريد وكلمة مرور لا تقل عن 8 أحرف",
    en: "Provide name, email, and a password with at least 8 characters",
  },
  emailExists: {
    ar: "البريد الإلكتروني مستخدم مسبقاً",
    en: "Email is already registered",
  },
  registerFailed: {
    ar: "تعذّر إنشاء الحساب",
    en: "Could not create account",
  },
  emailRequired: {
    ar: "البريد الإلكتروني مطلوب",
    en: "Email is required",
  },
  resetSent: {
    ar: "إن وُجد الحساب، أرسلنا رابط الاستعادة",
    en: "If the account exists, a reset link was prepared",
  },
  passwordTooShort: {
    ar: "كلمة المرور يجب ألا تقل عن 8 أحرف",
    en: "Password must be at least 8 characters",
  },
  passwordMismatch: {
    ar: "كلمتا المرور غير متطابقتين",
    en: "Passwords do not match",
  },
  invalidResetToken: {
    ar: "رابط الاستعادة غير صالح أو منتهي",
    en: "Reset link is invalid or expired",
  },
  resetSuccess: {
    ar: "تم تحديث كلمة المرور — يمكنك تسجيل الدخول",
    en: "Password updated — you can sign in",
  },
  loginFailed: {
    ar: "فشل تسجيل الدخول",
    en: "Sign in failed",
  },
  dbRequired: {
    ar: "يتطلب Auth.js اتصال PostgreSQL (DATABASE_URL). للتطوير المحلي شغّل Docker.",
    en: "Auth.js requires PostgreSQL (DATABASE_URL). Start Docker for local dev.",
  },
  rateLimited: {
    ar: "طلبات كثيرة جداً. حاول مرة أخرى بعد قليل.",
    en: "Too many requests. Please try again later.",
  },
} as const;

export type AuthMessageKey = keyof typeof messages;

export function authMessage(
  key: AuthMessageKey,
  locale: AuthLocale = "ar",
): string {
  return messages[key][locale] ?? messages[key].en;
}
