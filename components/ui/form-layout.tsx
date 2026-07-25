/**
 * تخطيط نماذج داخل Dialog
 *
 * الهيكل الإجباري (FormShell):
 *   form   (grid · h-full · rows: 1fr / auto · overflow-hidden)
 *     scroll  (minmax(0,1fr) · overflow-y-auto)  ← الحقول فقط
 *     footer  (auto · shrink-0)                    ← أزرار ثابتة — ليست داخل scroll
 *
 * يعتمد على أن Dialog body يمرّر ارتفاعاً محدوداً (h-0 flex-1).
 */
import type { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** غلاف النموذج: محتوى قابل للتمرير + أزرار ثابتة في الأسفل */
export function FormShell({
  children,
  actions,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
  /** أزرار الحفظ/الإلغاء — تُعرض دائماً أسفل الـ Dialog (خارج الـ scroll) */
  actions?: ReactNode;
}) {
  return (
    <form
      className={cn(
        // CSS Grid أوثق من flex لتثبيت الـ footer
        "grid h-full min-h-0 w-full max-h-full overflow-hidden",
        actions
          ? "grid-rows-[minmax(0,1fr)_auto]"
          : "grid-rows-[minmax(0,1fr)]",
        className,
      )}
      {...props}
    >
      {/* ★ Content — المنطقة الوحيدة القابلة للتمرير */}
      <div
        className={cn(
          "min-h-0 overflow-y-auto overscroll-y-contain",
          "[-webkit-overflow-scrolling:touch]",
          "px-4 pt-4 sm:px-6 sm:pt-5",
          // مسافة سفلية حتى لا يلتصق آخر حقل بخط الأزرار
          actions ? "pb-6 sm:pb-8" : "pb-4 sm:pb-5",
        )}
      >
        <div className="flex flex-col gap-5 sm:gap-6">{children}</div>
      </div>

      {/* ★ Footer — ثابت، خارج overflow-y-auto */}
      {actions ? (
        <div
          className={cn(
            "flex-shrink-0 border-t border-border/80 bg-card",
            "px-4 pt-3 sm:px-6 sm:pt-4",
            // safe-area لشريط Home على iPhone
            "pb-safe pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5",
          )}
        >
          {actions}
        </div>
      ) : null}
    </form>
  );
}

/**
 * شبكة حقول:
 * - موبايل: عمود واحد
 * - sm+: عمودان
 */
export function FormGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        "sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** حقل بعرض كامل داخل FormGrid */
export function FormFull({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 sm:col-span-2", className)}>{children}</div>
  );
}

/** قسم فرعي */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 space-y-3.5", className)}>
      {title || description ? (
        <div className="space-y-0.5">
          {title ? (
            <h3 className="text-sm font-bold leading-6 text-foreground">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="text-xs leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * أزرار النموذج:
 * - موبايل: full-width · عمودي · الحفظ فوق الإلغاء (flex-col-reverse مع ترتيب DOM: إلغاء ثم حفظ)
 * - sm+: صف أفقي محاذاة النهاية
 */
export function FormActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse gap-2.5",
        "sm:flex-row sm:items-center sm:justify-end sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** تنبيه أعلى النموذج */
export function FormAlert({
  tone = "error",
  children,
  className,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    error:
      "border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
    success:
      "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    info: "border-border bg-muted/50 text-muted-foreground",
  } as const;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border px-3.5 py-3 text-sm leading-6",
        styles[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
