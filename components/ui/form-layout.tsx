/**
 * تخطيط نماذج Soft Minimalism — Mobile-first
 * - شبكة حقول: عمود واحد على الموبايل، عمودين من sm
 * - أزرار sticky في الأسفل (تلتصق بأسفل الـ Dialog على الموبايل)
 */
import type { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** غلاف النموذج داخل Dialog (يملأ الارتفاع + footer ثابت) */
export function FormShell({
  children,
  actions,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
  /** أزرار الحفظ/الإلغاء — sticky على الموبايل */
  actions?: ReactNode;
}) {
  return (
    <form
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        /* عند عدم كون الأب flex، يبقى تدفقاً عادياً */
        className,
      )}
      {...props}
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-0.5 pb-2 [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
      {actions ? (
        <div
          className={cn(
            "sticky bottom-0 z-10 -mx-1 mt-auto shrink-0 border-t border-border/80",
            "bg-card/95 px-1 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            "backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
            "sm:static sm:mx-0 sm:bg-transparent sm:pt-4 sm:pb-0 sm:backdrop-blur-none",
          )}
        >
          {actions}
        </div>
      ) : null}
    </form>
  );
}

/** شبكة حقول: stack على الموبايل */
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
        "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** حقل بعرض كامل داخل الشبكة */
export function FormFull({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("sm:col-span-2", className)}>{children}</div>;
}

/** عنوان قسم فرعي داخل النموذج */
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
    <section className={cn("space-y-3.5", className)}>
      {title || description ? (
        <div className="space-y-0.5">
          {title ? (
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
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

/** أزرار الإجراءات — full-width على الموبايل */
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
        "flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** تنبيه خطأ / نجاح داخل النموذج */
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
