"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/lib/auth/actions";
import { useLanguage } from "@/components/providers/language-provider";

export function ResetPasswordForm() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("locale", locale);
    formData.set("token", token);
    formData.set("email", email);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (!result.success) {
        setError(result.error ?? null);
        return;
      }
      router.push(result.redirectTo ?? "/login");
    });
  }

  return (
    <AuthShell
      title={ar ? "إعادة تعيين كلمة المرور" : "Reset password"}
      subtitle={
        ar
          ? "اختر كلمة مرور جديدة لحسابك"
          : "Choose a new password for your account"
      }
      footer={
        <Link href="/login" className="font-bold text-primary hover:underline">
          {ar ? "العودة لتسجيل الدخول" : "Back to sign in"}
        </Link>
      }
    >
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />

        {!token || !email ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {ar
              ? "رابط الاستعادة ناقص. اطلب رابطاً جديداً من صفحة نسيت كلمة المرور."
              : "Reset link is incomplete. Request a new one from forgot password."}
          </p>
        ) : null}

        <Input
          required
          name="password"
          type="password"
          minLength={8}
          label={ar ? "كلمة المرور الجديدة" : "New password"}
          placeholder={ar ? "8 أحرف على الأقل" : "At least 8 characters"}
          startIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
        />
        <Input
          required
          name="confirmPassword"
          type="password"
          minLength={8}
          label={ar ? "تأكيد كلمة المرور" : "Confirm password"}
          placeholder={ar ? "أعد كتابة كلمة المرور" : "Repeat password"}
          startIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
        />
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending || !token || !email}
          className="w-full"
        >
          {pending
            ? ar
              ? "جارٍ الحفظ..."
              : "Saving..."
            : ar
              ? "تحديث كلمة المرور"
              : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
