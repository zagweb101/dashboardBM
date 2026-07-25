"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth/actions";
import { useLanguage } from "@/components/providers/language-provider";

export function LoginForm() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("locale", locale);
    formData.set("next", next);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <AuthShell
      title={ar ? "تسجيل الدخول" : "Sign in"}
      subtitle={
        ar
          ? "ادخل بريدك وكلمة المرور للوصول إلى لوحة بيت المصور"
          : "Enter your email and password to access Bayt Al-Musawir"
      }
      footer={
        <>
          {ar ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
          <Link href="/register" className="font-bold text-primary hover:underline">
            {ar ? "إنشاء حساب" : "Create account"}
          </Link>
        </>
      }
    >
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next} />

        <Input
          required
          name="email"
          type="email"
          label={ar ? "البريد الإلكتروني" : "Email"}
          defaultValue="owner@example.com"
          placeholder="name@example.com"
          startIcon={<Mail className="h-4 w-4" />}
          autoComplete="email"
        />

        <Input
          required
          name="password"
          type={showPassword ? "text" : "password"}
          label={ar ? "كلمة المرور" : "Password"}
          defaultValue="password123"
          placeholder="••••••••"
          startIcon={<Lock className="h-4 w-4" />}
          autoComplete="current-password"
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={ar ? "إظهار كلمة المرور" : "Toggle password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="remember"
              className="rounded border-border text-primary"
              defaultChecked
            />
            <span>{ar ? "تذكرني" : "Remember me"}</span>
          </label>
          <Link
            href="/forgot-password"
            className="font-semibold text-primary hover:underline"
          >
            {ar ? "نسيت كلمة المرور؟" : "Forgot password?"}
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : (
          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
            {ar ? (
              <>
                حسابات تجريبية: owner@ / admin@ / manager@ / employee@ /
                viewer@example.com — كلمة المرور{" "}
                <strong>password123</strong>
              </>
            ) : (
              <>
                Demo: owner@ / admin@ / manager@ / employee@ /
                viewer@example.com — password <strong>password123</strong>
              </>
            )}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? ar
              ? "جارٍ الدخول..."
              : "Signing in..."
            : ar
              ? "دخول لوحة التحكم"
              : "Sign in to dashboard"}
        </Button>
      </form>
    </AuthShell>
  );
}
