import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: ReactNode;
  accent?: string;
  className?: string;
  /** نص ثانوي تحت النسبة — اختياري لتجنب الزحام */
  changeHint?: string;
};

/**
 * بطاقة إحصائية — مسافات واضحة بين العنوان / الرقم / النسبة
 * min-w-0 + break-words يمنع تداخل العربي مع الأرقام
 */
export function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  accent,
  className,
  changeHint = "مقارنة بالفترة السابقة",
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-muted-foreground";

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]",
        className,
      )}
    >
      {/* صف علوي: عنوان + أيقونة */}
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-muted-foreground break-words">
          {title}
        </p>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
            accent ?? "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </div>
      </div>

      {/* الرقم — سطر مستقل بمسافة كافية */}
      <p
        className={cn(
          "mt-3 min-w-0 text-xl font-extrabold tracking-tight text-card-foreground sm:text-2xl",
          "break-words leading-tight tabular-nums",
        )}
        dir="auto"
      >
        {value}
      </p>

      {/* النسبة + التلميح — flex-wrap يمنع التصادم */}
      <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-xs leading-5">
        <span
          className={cn(
            "shrink-0 font-bold tabular-nums",
            trendColor,
          )}
          dir="ltr"
        >
          {change}
        </span>
        {changeHint ? (
          <span className="min-w-0 text-muted-foreground break-words">
            {changeHint}
          </span>
        ) : null}
      </div>
    </article>
  );
}
