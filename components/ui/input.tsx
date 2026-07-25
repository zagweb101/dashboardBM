import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

/** حقل إدخال — Soft Minimalism + لمس مريح على الموبايل */
export function Input({
  className,
  label,
  hint,
  error,
  startIcon,
  endIcon,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block min-w-0 space-y-1.5" htmlFor={inputId}>
      {label ? (
        <span className="block text-sm font-semibold text-foreground/90">
          {label}
        </span>
      ) : null}
      <div className="relative min-w-0">
        {startIcon ? (
          <span className="pointer-events-none absolute top-1/2 start-3.5 z-10 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            "h-12 w-full min-w-0 max-w-full rounded-2xl border border-border/90 bg-background",
            "text-sm text-foreground outline-none transition-all duration-200",
            "placeholder:text-muted-foreground/70",
            "hover:border-border",
            "focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
            "disabled:cursor-not-allowed disabled:opacity-60",
            // لمس أوضح على iOS
            "text-base sm:text-sm",
            startIcon ? "ps-11" : "ps-3.5",
            endIcon ? "pe-11" : "pe-3.5",
            error &&
              "border-danger/70 focus:border-danger focus:ring-danger/15",
            className,
          )}
          {...props}
        />
        {endIcon ? (
          <span className="absolute top-1/2 end-3.5 z-10 -translate-y-1/2 text-muted-foreground">
            {endIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <span className="block text-xs leading-5 text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-xs leading-5 text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
