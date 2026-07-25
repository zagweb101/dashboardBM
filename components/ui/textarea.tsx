import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  className,
  label,
  hint,
  error,
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const areaId = id ?? props.name;

  return (
    <label className="block min-w-0 space-y-1.5" htmlFor={areaId}>
      {label ? (
        <span className="block text-sm font-semibold text-foreground/90">
          {label}
        </span>
      ) : null}
      <textarea
        id={areaId}
        rows={rows}
        className={cn(
          "w-full min-w-0 max-w-full resize-y rounded-2xl border border-border/90 bg-background",
          "px-3.5 py-3 text-base text-foreground outline-none transition-all duration-200 sm:text-sm",
          "placeholder:text-muted-foreground/70",
          "hover:border-border",
          "focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-danger/70 focus:border-danger focus:ring-danger/15",
          className,
        )}
        {...props}
      />
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
