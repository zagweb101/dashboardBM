import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** شارة رقمية اختيارية (تُمرَّر ديناميكياً من الـ layout) */
  badge?: string | number;
};

/** أعداد الشارات في القائمة الجانبية */
export type NavBadges = Partial<Record<string, number>>;

export type StatTrend = "up" | "down" | "neutral";

export type StatCardData = {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: StatTrend;
  icon: LucideIcon;
  accent?: string;
};

export type ChartSlice = {
  name: string;
  value: number;
  color: string;
};

export type BarPoint = {
  name: string;
  revenue: number;
  profit: number;
};

export type LinePoint = {
  name: string;
  users: number;
  sessions: number;
};

export type CourseRow = {
  id: string;
  title: string;
  instructor: string;
  date: string;
  students: number;
  status: "قادم" | "جاري" | "مكتمل";
};

export type PaymentRow = {
  id: string;
  customer: string;
  amount: string;
  method: string;
  date: string;
  status: "مكتمل" | "قيد الانتظار" | "فاشل";
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  status: "نشط" | "معلق" | "غير نشط";
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
};

export type CurrentUser = {
  name: string;
  role: string;
  email: string;
  avatarInitials: string;
};
