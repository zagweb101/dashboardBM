import type { Role } from "@/types/rbac";
import type { OrganizationSubscription } from "@/types/billing";
import type { Student } from "@/types/student";
import type { Customer } from "@/types/customer";
import type { Report, ReportSummary } from "@/types/report";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
};

export type ThemePreference = "light" | "dark" | "system";

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  role: Role;
  organizationId: string;
  locale: "ar" | "en";
  theme?: ThemePreference;
  createdAt: string;
  updatedAt?: string;
};

export type ProfileUpdateInput = {
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  locale?: "ar" | "en";
  theme?: ThemePreference;
};

export type TeamInviteInput = {
  email: string;
  fullName: string;
  role: Role;
  temporaryPassword?: string;
};

export type AuthSessionRow = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
};

export type AnalyticsPoint = {
  label: string;
  revenue: number;
  customers: number;
  churn: number;
};

export type DatabaseSchema = {
  organizations: Organization[];
  profiles: Profile[];
  customers: Customer[];
  students: Student[];
  subscriptions: OrganizationSubscription[];
  reports: Report[];
  analytics: AnalyticsPoint[];
};

export type { Student } from "@/types/student";
export type { Customer, CustomerStatus } from "@/types/customer";
export type { Report, ReportSummary, ReportType } from "@/types/report";
