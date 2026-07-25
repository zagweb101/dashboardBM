"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Building2, Lock, Mail, User } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/lib/auth/actions";
import { useLanguage } from "@/components/providers/language-provider";

export function RegisterForm() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("locale", locale);
    startTransition(async () => {
      const result = await registerAction(formData);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <AuthShell
      title={ar ? "إنشاء حساب" : "Create account"}
      subtitle={
        ar
          ? "أنشئ مساحة عمل لمركز التدريب خلال دقائق"
          : "Spin up a training-center workspace in minutes"
      }
      footer={
        <>
          {ar ? "لديك حساب؟" : "Already have an account?"}{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            {ar ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </>
      }
    >
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <Input
          required
          name="fullName"
          type="text"
          label={ar ? "الاسم الكامل" : "Full name"}
          placeholder={ar ? "أحمد المنصوري" : "Ahmed Almansouri"}
          startIcon={<User className="h-4 w-4" />}
          autoComplete="name"
        />
        <Input
          required
          name="email"
          type="email"
          label={ar ? "البريد الإلكتروني" : "Email"}
          placeholder="name@example.com"
          startIcon={<Mail className="h-4 w-4" />}
          autoComplete="email"
        />
        <Input
          name="organizationName"
          type="text"
          label={ar ? "اسم المركز / المؤسسة" : "Organization"}
          placeholder={ar ? "بيت المصور" : "Bayt Al-Musawir"}
          startIcon={<Building2 className="h-4 w-4" />}
        />
        <Input
          required
          name="password"
          type="password"
          minLength={8}
          label={ar ? "كلمة المرور" : "Password"}
          placeholder={ar ? "8 أحرف على الأقل" : "At least 8 characters"}
          startIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            required
            type="checkbox"
            name="terms"
            className="mt-1 rounded border-border text-primary"
          />
          <span>
            {ar ? (
              <>
                أوافق على{" "}
                <span className="font-semibold text-foreground">الشروط</span> و
                <span className="font-semibold text-foreground">
                  {" "}
                  سياسة الخصوصية
                </span>
              </>
            ) : (
              <>
                I agree to the{" "}
                <span className="font-semibold text-foreground">Terms</span> and{" "}
                <span className="font-semibold text-foreground">
                  Privacy Policy
                </span>
              </>
            )}
          </span>
        </label>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {ar
              ? "الدور الافتراضي عند التسجيل: موظف (Employee)"
              : "Default role on signup: Employee"}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? ar
              ? "جارٍ الإنشاء..."
              : "Creating..."
            : ar
              ? "إنشاء الحساب"
              : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
