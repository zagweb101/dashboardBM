import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">...</div>}>
      <LoginForm />
    </Suspense>
  );
}
