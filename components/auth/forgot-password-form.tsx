"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { useLanguage } from "@/components/providers/language-provider";

export function ForgotPasswordForm() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("locale", locale);
    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (!result.success) {
        setError(result.error ?? null);
        return;
      }
      // في التطوير: نوجّه مباشرة لصفحة الاستعادة مع التوكن
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      setSent(true);
    });
  }

  return (
    <AuthShell
      title={ar ? "نسيت كلمة المرور" : "Forgot password"}
      subtitle={
        ar
          ? "أدخل بريدك وسنجهّز رابط الاستعادة"
          : "Enter your email and we'll prepare a reset link"
      }
      footer={
        <>
          {ar ? "تذكرت كلمة المرور؟" : "Remembered it?"}{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            {ar ? "العودة لتسجيل الدخول" : "Back to sign in"}
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {ar
            ? "إن وُجد حساب بهذا البريد، تم تجهيز رابط الاستعادة. تحقق من سجلات الخادم في وضع التطوير."
            : "If an account exists, a reset link was prepared. Check server logs in development."}
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <Input
            required
            name="email"
            type="email"
            label={ar ? "البريد الإلكتروني" : "Email"}
            placeholder="name@example.com"
            startIcon={<Mail className="h-4 w-4" />}
            autoComplete="email"
          />
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending
              ? ar
                ? "جارٍ الإرسال..."
                : "Sending..."
              : ar
                ? "إرسال رابط الاستعادة"
                : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
