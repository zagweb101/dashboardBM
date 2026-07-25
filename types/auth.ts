import type { Role } from "@/types/rbac";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  avatarInitials: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  locale: "ar" | "en";
  theme?: "light" | "dark" | "system";
  createdAt: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  fullName: string;
  email: string;
  password: string;
  organizationName?: string;
};

export type AuthResult =
  | { success: true; redirectTo?: string }
  | { success: false; error: string };
