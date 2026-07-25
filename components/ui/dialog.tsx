"use client";

/**
 * Dialog — هيكل بسيط ومضمون:
 *
 *   panel  (relative · flex-col · ارتفاع محدد · overflow-hidden)
 *     header  (shrink-0)
 *     body    (flex-1 · overflow-y-auto · pb-28 عند وجود footer)
 *     footer  (absolute bottom-0 inset-x-0 · z-20)  ← دائماً ظاهر
 */
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type MouseEvent,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** أزرار ثابتة ملتصقة بأسفل اللوحة */
  footer?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** full = شاشة كاملة على الموبايل | sheet = من الأسفل */
  mobile?: "full" | "sheet";
};

const sizes = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-5xl",
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = "lg",
  mobile = "full",
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const timer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('[data-dialog-close="true"]')
        ?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  function handleBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onOpenChange(false);
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex justify-center",
        "bg-slate-900/40 backdrop-blur-[3px] dark:bg-black/55",
        "items-stretch p-0 sm:items-center sm:p-4 sm:py-6",
      )}
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      {/* ── Panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative flex w-full flex-col overflow-hidden",
          "border-border bg-card text-card-foreground shadow-[var(--shadow-hover)]",
          "animate-in fade-in duration-200",

          // موبايل: ملء الشاشة | ديسكتوب: 90dvh
          mobile === "full" && [
            "h-[100dvh] max-h-[100dvh] rounded-none border-0",
            "sm:h-[min(90dvh,880px)] sm:max-h-[min(90dvh,880px)]",
            "sm:rounded-2xl sm:border",
          ],

          mobile === "sheet" && [
            "mt-auto h-auto max-h-[min(92dvh,720px)] rounded-t-3xl border border-b-0",
            "sm:mt-0 sm:max-h-[min(85dvh,560px)] sm:rounded-2xl sm:border",
          ],

          sizes[size],
          className,
        )}
      >
        {/* ── Header ── */}
        <div className="relative z-10 shrink-0 bg-card">
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
          </div>
          <header className="flex items-start justify-between gap-3 border-b border-border/80 px-4 pb-3.5 pt-2 sm:px-6 sm:pb-4 sm:pt-5">
            <div className="min-w-0 flex-1 pe-2">
              <h2
                id={titleId}
                className="text-base font-extrabold tracking-tight text-card-foreground sm:text-lg"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm leading-6 text-muted-foreground"
                >
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              data-dialog-close="true"
              onClick={() => onOpenChange(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
        </div>

        {/* ── Body (التمرير الوحيد) ── */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overscroll-y-contain",
            "[-webkit-overflow-scrolling:touch]",
            // مساحة تحت آخر حقل حتى لا يختبئ تحت الـ footer المطلق
            footer ? "pb-28 sm:pb-32" : "pb-4",
          )}
        >
          <div className="px-4 pt-4 sm:px-6 sm:pt-5">{children}</div>
        </div>

        {/* ── Footer (ملتصق بالأسفل — دائماً فوق المحتوى) ── */}
        {footer ? (
          <footer
            className={cn(
              "absolute inset-x-0 bottom-0 z-20",
              "border-t border-border bg-card",
              "px-4 pt-3 sm:px-6 sm:pt-4",
              "pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5",
              "shadow-[0_-4px_16px_rgba(15,23,42,0.06)]",
            )}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
