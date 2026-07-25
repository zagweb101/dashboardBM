import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

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
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label ? <span className="text-sm font-semibold">{label}</span> : null}
      <div className="relative">
        {startIcon ? (
          <span className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-background text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15",
            startIcon ? "ps-10" : "ps-3",
            endIcon ? "pe-10" : "pe-3",
            error && "border-danger focus:border-danger focus:ring-danger/15",
            className,
          )}
          {...props}
        />
        {endIcon ? (
          <span className="absolute top-1/2 end-3 z-10 -translate-y-1/2 text-muted-foreground">
            {endIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
