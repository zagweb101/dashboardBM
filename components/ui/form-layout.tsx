/**
 * تخطيط نماذج — إصلاح التمرير داخل Dialog
 *
 * الهيكل الصحيح:
 *   form (flex-col · flex-1 · min-h-0 · h-full · overflow-hidden)
 *     scroll  (flex-1 · min-h-0 · overflow-y-auto)  ← الحقول فقط
 *     footer  (shrink-0)  ← أزرار ثابتة، بدون sticky فوق المحتوى
 *
 * ملاحظة: sticky داخل منطقة scroll كان يغطي الحقول الأخيرة — أُزيل.
 */
import type { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** غلاف النموذج داخل Dialog */
export function FormShell({
  children,
  actions,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
  /** أزرار الحفظ/الإلغاء — ثابتة في الأسفل (ليست sticky فوق الحقول) */
  actions?: ReactNode;
}) {
  return (
    <form
      className={cn(
        // يملأ body الـ Dialog ويقيّد الارتفاع
        "flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden",
        className,
      )}
      {...props}
    >
      {/*
        ★ منطقة التمرير الوحيدة
        min-h-0 + overflow-y-auto = يظهر شريط التمرير عندما يزيد المحتوى
        pb-* إضافي يضمن ظهور آخر حقل فوق خط الفاصل مع الأزرار
      */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-y-contain",
          "[-webkit-overflow-scrolling:touch]",
          "px-4 pt-4 sm:px-6 sm:pt-5",
          // مساحة سفلية داخل الـ scroll حتى لا يلتصق آخر حقل بالحافة
          actions ? "pb-6 sm:pb-8" : "pb-4 sm:pb-5",
        )}
      >
        <div className="space-y-5">{children}</div>
      </div>

      {/* Footer ثابت — shrink-0 · خارج منطقة التمرير */}
      {actions ? (
        <div
          className={cn(
            "shrink-0 border-t border-border/80 bg-card",
            "px-4 pt-3 sm:px-6 sm:pt-4",
            // safe-area لشريط Home على iPhone
            "pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5",
          )}
        >
          {actions}
        </div>
      ) : null}
    </form>
  );
}

/** شبكة حقول: عمود واحد على الموبايل */
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

/** حقل بعرض كامل */
export function FormFull({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("sm:col-span-2", className)}>{children}</div>;
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

/** أزرار — full-width على الموبايل */
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
        "flex flex-col-reverse gap-2.5",
        "sm:flex-row sm:items-center sm:justify-end sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** تنبيه */
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
