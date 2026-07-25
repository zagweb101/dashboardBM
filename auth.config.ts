/**
 * إعدادات Auth.js المشتركة (خفيفة — صالحة لـ Edge/proxy)
 * المنطق الثقيل (bcrypt / pg) في auth.ts
 *
 * ملاحظة: providers يجب أن تكون هنا أيضاً كـ stub فارغ لأن proxy يستورد هذا الملف فقط.
 * الـ Credentials الحقيقي يُعرَّف في auth.ts
 */
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/register",
  },
  /**
   * Credentials stub للـ Edge — authorize الفعلي في auth.ts
   * (دمج الإعدادات في NextAuth(authConfig) + providers الكاملة)
   */
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // لا يُستدعى من Edge — المنطق في auth.ts
      authorize: () => null,
    }),
  ],
  session: {
    /**
     * Credentials يتطلب JWT (قيود Auth.js الرسمية).
     * جدول users/sessions في Postgres يخزّن الحسابات + جلسات OAuth المستقبلية.
     */
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  callbacks: {
    // jwt / session تُعرَّف في auth.ts (Node runtime)
    // authorized يُترك لـ proxy.ts
  },
  // AUTH_TRUST_HOST=true على Railway خلف البروكسي
  trustHost:
    process.env.AUTH_TRUST_HOST === "true" ||
    process.env.AUTH_TRUST_HOST === "1" ||
    true,
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
