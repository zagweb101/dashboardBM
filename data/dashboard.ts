import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
  UserPlus,
  Wallet,
} from "lucide-react";
import type {
  BarPoint,
  ChartSlice,
  LinePoint,
  NavItem,
  NotificationItem,
  PaymentRow,
  StatCardData,
  UserRow,
} from "@/types/dashboard";
import type { Permission } from "@/types/rbac";

export type AppNavItem = NavItem & {
  permission?: Permission;
};

export const navItems: AppNavItem[] = [
  {
    label: "لوحة التحكم",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:view",
  },
  {
    label: "المتدربون",
    href: "/students",
    icon: GraduationCap,
    permission: "students:view",
  },
  {
    label: "الدورات",
    href: "/courses",
    icon: BookOpen,
    permission: "courses:view",
  },
  {
    label: "الحضور",
    href: "/attendance",
    icon: CalendarCheck,
    permission: "attendance:view",
  },
  {
    label: "مدفوعات المتدربين",
    href: "/payments",
    icon: Wallet,
    permission: "payments:view",
  },
  {
    label: "التحليلات",
    href: "/analytics",
    icon: BarChart3,
    permission: "analytics:view",
  },
  {
    label: "العملاء",
    href: "/customers",
    icon: Users,
    permission: "customers:view",
  },
  {
    label: "التقارير",
    href: "/reports",
    icon: TrendingUp,
    permission: "reports:view",
  },
  {
    label: "الفوترة",
    href: "/billing",
    icon: CreditCard,
    permission: "billing:view",
  },
  {
    label: "الإعدادات",
    href: "/settings",
    icon: Settings,
    permission: "settings:view",
  },
];

export const navItemKeys = {
  "/dashboard": "dashboard",
  "/students": "students",
  "/courses": "coursesNav",
  "/attendance": "attendanceNav",
  "/payments": "paymentsNav",
  "/analytics": "analytics",
  "/customers": "customers",
  "/reports": "reports",
  "/billing": "billing",
  "/settings": "settings",
} as const;

export const statsCards: StatCardData[] = [
  {
    id: "revenue-today",
    title: "إيرادات اليوم",
    value: "١٢٬٤٥٠ ر.س",
    change: "+١٢٫٤٪",
    trend: "up",
    icon: Wallet,
    accent: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  },
  {
    id: "revenue-month",
    title: "إيرادات الشهر",
    value: "١٨٦٬٣٢٠ ر.س",
    change: "+٨٫١٪",
    trend: "up",
    icon: TrendingUp,
    accent:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  {
    id: "revenue-year",
    title: "إيرادات السنة",
    value: "٢٫١ م ر.س",
    change: "+٢١٫٦٪",
    trend: "up",
    icon: BarChart3,
    accent: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  },
  {
    id: "profit",
    title: "صافي الربح",
    value: "٤٢٬٨٩٠ ر.س",
    change: "+٥٫٢٪",
    trend: "up",
    icon: Activity,
    accent:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    id: "active-users",
    title: "المستخدمون النشطون",
    value: "٣٬٢٤٨",
    change: "+٣٫٨٪",
    trend: "up",
    icon: Users,
    accent: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    id: "new-registrations",
    title: "التسجيلات الجديدة",
    value: "١٨٦",
    change: "-٢٫١٪",
    trend: "down",
    icon: UserPlus,
    accent: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  },
];

export const donutData: ChartSlice[] = [
  { name: "اشتراكات", value: 42, color: "#e11d48" },
  { name: "خدمات", value: 28, color: "#f43f5e" },
  { name: "باقات", value: 18, color: "#fb7185" },
  { name: "أخرى", value: 12, color: "#fecdd3" },
];

export const barData: BarPoint[] = [
  { name: "يناير", revenue: 42000, profit: 18000 },
  { name: "فبراير", revenue: 38000, profit: 16000 },
  { name: "مارس", revenue: 51000, profit: 22000 },
  { name: "أبريل", revenue: 47000, profit: 20000 },
  { name: "مايو", revenue: 61000, profit: 27000 },
  { name: "يونيو", revenue: 58000, profit: 25000 },
];

export const lineData: LinePoint[] = [
  { name: "السبت", users: 420, sessions: 680 },
  { name: "الأحد", users: 510, sessions: 740 },
  { name: "الاثنين", users: 490, sessions: 710 },
  { name: "الثلاثاء", users: 560, sessions: 820 },
  { name: "الأربعاء", users: 610, sessions: 890 },
  { name: "الخميس", users: 580, sessions: 860 },
  { name: "الجمعة", users: 640, sessions: 920 },
];

export const latestPayments: PaymentRow[] = [
  {
    id: "p1",
    customer: "محمد العلي",
    amount: "١٬١٩٩ ر.س",
    method: "مدى",
    date: "اليوم · 09:42",
    status: "مكتمل",
  },
  {
    id: "p2",
    customer: "لمى الدوسري",
    amount: "٤٩٩ ر.س",
    method: "أبل باي",
    date: "اليوم · 08:15",
    status: "مكتمل",
  },
  {
    id: "p3",
    customer: "يوسف الزهراني",
    amount: "٢٬٤٩٩ ر.س",
    method: "تحويل بنكي",
    date: "أمس · 21:03",
    status: "قيد الانتظار",
  },
  {
    id: "p4",
    customer: "رهف السبيعي",
    amount: "٢٩٩ ر.س",
    method: "بطاقة",
    date: "أمس · 16:40",
    status: "فاشل",
  },
];

export const latestUsers: UserRow[] = [
  {
    id: "u1",
    name: "عبدالله المطيري",
    email: "abdullah@example.com",
    role: "مشترك",
    joinedAt: "منذ ساعتين",
    status: "نشط",
  },
  {
    id: "u2",
    name: "هند العتيبي",
    email: "hind@example.com",
    role: "مدرب",
    joinedAt: "منذ ٥ ساعات",
    status: "نشط",
  },
  {
    id: "u3",
    name: "رامي الشهري",
    email: "rami@example.com",
    role: "مشترك",
    joinedAt: "أمس",
    status: "معلق",
  },
  {
    id: "u4",
    name: "جمانة الغامدي",
    email: "jumana@example.com",
    role: "مسؤول",
    joinedAt: "منذ يومين",
    status: "غير نشط",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "دفعة جديدة",
    description: "تم استلام دفعة بقيمة ١٬١٩٩ ر.س من محمد العلي",
    time: "قبل ٥ دقائق",
    unread: true,
  },
  {
    id: "n2",
    title: "مستخدم جديد",
    description: "انضم عبدالله المطيري إلى المنصة",
    time: "قبل ساعة",
    unread: true,
  },
  {
    id: "n3",
    title: "تذكير تقرير",
    description: "تقرير الإيرادات الشهري جاهز للمراجعة",
    time: "قبل ٣ ساعات",
  },
];

export const headerQuickLinks = {
  notificationsIcon: Bell,
};
