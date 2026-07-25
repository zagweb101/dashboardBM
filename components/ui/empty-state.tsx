/**
 * حالة فارغة موحّدة — أيقونة + عنوان + وصف + إجراء
 */
import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarCheck,
  FileText,
  GraduationCap,
  Inbox,
  type LucideIcon,
  Users,
  Wallet,
  CreditCard,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** حجم أخف للجداول داخل بطاقة */
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-center shadow-[var(--shadow-soft)]",
        compact ? "px-4 py-10" : "px-6 py-14",
        className,
      )}
      role="status"
    >
      {icon ? (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-2xl bg-primary/10 text-primary",
            compact ? "h-12 w-12" : "h-14 w-14",
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3
        className={cn(
          "font-bold text-card-foreground",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "mt-2 max-w-md leading-7 text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/** أيقونة Lucide جاهزة للحالات الفارغة */
export function EmptyIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return <Icon className={cn("h-6 w-6", className)} aria-hidden />;
}

/** نصوص جاهزة AR/EN لكل قسم */
export const emptyCopy = {
  students: {
    ar: {
      title: "لا يوجد متدربون",
      description:
        "ابدأ بإضافة أول متدرب لمركز بيت المصور. يمكنك لاحقاً تسجيله في الدورات وتتبع حضوره.",
      action: "إضافة متدرب",
    },
    en: {
      title: "No students yet",
      description:
        "Add your first trainee to Bayt Al-Musawir. You can enroll them in courses and track attendance later.",
      action: "Add student",
    },
    icon: GraduationCap,
  },
  courses: {
    ar: {
      title: "لا توجد دورات",
      description:
        "أنشئ دورة تصوير جديدة لفتح باب التسجيل وتحديد المقاعد والمدرب.",
      action: "دورة جديدة",
    },
    en: {
      title: "No courses yet",
      description:
        "Create a photography course to open enrollments and set seats.",
      action: "New course",
    },
    icon: BookOpen,
  },
  customers: {
    ar: {
      title: "لا يوجد عملاء",
      description: "أضف شركاء B2B أو جهات اتصال للشركات المتعاونة مع المركز.",
      action: "عميل جديد",
    },
    en: {
      title: "No customers yet",
      description: "Add B2B partners or corporate contacts for your center.",
      action: "Add customer",
    },
    icon: Users,
  },
  attendance: {
    ar: {
      title: "لا سجلات حضور",
      description:
        "اختر دورة وتاريخاً ثم سجّل حضور المتدربين. يلزم وجود تسجيلات نشطة في الدورة.",
      action: "الذهاب للدورات",
    },
    en: {
      title: "No attendance records",
      description:
        "Pick a course and date, then mark trainees. Active enrollments are required.",
      action: "Go to courses",
    },
    icon: CalendarCheck,
  },
  payments: {
    ar: {
      title: "لا مدفوعات",
      description:
        "سجّل أول دفعة رسوم دورة (نقداً، تحويل، بطاقة…). هذه إيرادات المركز وليست فوترة Stripe.",
      action: "تسجيل دفعة",
    },
    en: {
      title: "No payments yet",
      description:
        "Record the first tuition payment. This is center revenue, not SaaS billing.",
      action: "Record payment",
    },
    icon: Wallet,
  },
  reports: {
    ar: {
      title: "لا تقارير",
      description: "أنشئ تقريراً مالياً أو حضور أو مبيعات لمتابعة أداء المركز.",
      action: "تقرير جديد",
    },
    en: {
      title: "No reports yet",
      description:
        "Create a financial, attendance, or sales report to track performance.",
      action: "New report",
    },
    icon: FileText,
  },
  billing: {
    ar: {
      title: "لا فواتير",
      description: "ستظهر فواتير الاشتراك هنا بعد تفعيل Stripe وربط Webhook.",
      action: "عرض الخطط",
    },
    en: {
      title: "No invoices",
      description:
        "Subscription invoices appear here after Stripe is live and webhooks are connected.",
      action: "View plans",
    },
    icon: CreditCard,
  },
  settings: {
    ar: {
      title: "لا أعضاء",
      description: "ادعُ زملاءك لإدارة المركز معاً من تبويب الفريق.",
      action: "إضافة عضو",
    },
    en: {
      title: "No team members",
      description: "Invite teammates from the Team tab to manage the center.",
      action: "Add member",
    },
    icon: Settings,
  },
  dashboard: {
    ar: {
      title: "مرحباً بك في بيت المصور",
      description: "ابدأ بإضافة متدربين ودورات لرؤية الإحصائيات هنا.",
      action: "المتدربون",
    },
    en: {
      title: "Welcome to Bayt Al-Musawir",
      description: "Add students and courses to see live stats here.",
      action: "Students",
    },
    icon: LayoutDashboard,
  },
  generic: {
    ar: {
      title: "لا توجد بيانات",
      description: "جرّب تعديل الفلاتر أو أضف سجلاً جديداً.",
      action: "تحديث",
    },
    en: {
      title: "Nothing here",
      description: "Try adjusting filters or add a new record.",
      action: "Refresh",
    },
    icon: Inbox,
  },
} as const;

export type EmptyCopyKey = keyof typeof emptyCopy;

export function getEmptyCopy(key: EmptyCopyKey, locale: "ar" | "en") {
  const entry = emptyCopy[key];
  return {
    ...entry[locale],
    Icon: entry.icon,
  };
}
