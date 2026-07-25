import type { DefaultSession } from "next-auth";
import type { Role } from "@/types/rbac";

/**
 * توسيع أنواع Auth.js بحقول التطبيق (role / organization)
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string;
      organizationName: string;
      locale: "ar" | "en";
      fullName: string;
      phone?: string;
      theme?: "light" | "dark" | "system";
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    organizationId?: string;
    organizationName?: string;
    locale?: "ar" | "en";
    fullName?: string;
    phone?: string;
    theme?: "light" | "dark" | "system";
    password_hash?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    organizationId?: string;
    organizationName?: string;
    locale?: "ar" | "en";
    fullName?: string;
    phone?: string;
    theme?: "light" | "dark" | "system";
  }
}
