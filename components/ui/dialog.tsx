"use client";

/**
 * Dialog / Sheet — Soft Minimalism + Mobile-first
 * - موبايل: شاشة كاملة تقريباً (bottom sheet → full height)
 * - ديسكتوب: نافذة مركزية بزوايا ناعمة
 * - body قابل للتمرير + footer اختياري sticky
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
  footer?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** على الموبايل: full = شاشة كاملة، sheet = من الأسفل بارتفاع محدود */
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
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
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
        "fixed inset-0 z-[80] flex justify-center bg-slate-900/40 backdrop-blur-[3px]",
        "items-stretch p-0",
        "sm:items-center sm:p-4 sm:py-6",
        "dark:bg-black/55",
      )}
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "flex w-full flex-col overflow-hidden border-border bg-card text-card-foreground",
          "animate-in fade-in duration-200",
          // موبايل: full screen أو sheet
          mobile === "full"
            ? "h-[100dvh] max-h-[100dvh] rounded-none border-0 sm:h-auto sm:max-h-[min(90vh,880px)] sm:rounded-2xl sm:border"
            : "mt-auto max-h-[92dvh] rounded-t-3xl border border-b-0 sm:mt-0 sm:max-h-[min(90vh,880px)] sm:rounded-2xl sm:border",
          // ظل ناعم
          "shadow-[var(--shadow-hover)]",
          sizes[size],
          className,
        )}
      >
        {/* مقبض السحب (موبايل) */}
        <div
          className="flex shrink-0 justify-center pt-2.5 sm:hidden"
          aria-hidden
        >
          <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/80 px-4 pb-3.5 pt-2 sm:px-6 sm:pb-4 sm:pt-5">
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
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* المحتوى: flex column حتى FormShell يملأ الارتفاع */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        {footer ? (
          <footer
            className={cn(
              "shrink-0 border-t border-border/80 bg-muted/20 px-4 py-3",
              "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              "sm:px-6 sm:py-4 sm:pb-4",
            )}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
