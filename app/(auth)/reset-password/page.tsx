import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "إعادة تعيين كلمة المرور",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
