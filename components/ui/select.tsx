import type { SelectHTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  startIcon?: ReactNode;
};

export function Select({
  className,
  label,
  hint,
  error,
  options,
  placeholder,
  startIcon,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="block min-w-0 space-y-1.5" htmlFor={selectId}>
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
        <select
          id={selectId}
          className={cn(
            "h-12 w-full min-w-0 max-w-full appearance-none rounded-2xl border border-border/90 bg-background",
            "text-base text-foreground outline-none transition-all duration-200 sm:text-sm",
            "hover:border-border",
            "focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
            "disabled:cursor-not-allowed disabled:opacity-60",
            startIcon ? "ps-11 pe-10" : "ps-3.5 pe-10",
            error &&
              "border-danger/70 focus:border-danger focus:ring-danger/15",
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 end-3.5 z-10 -translate-y-1/2 text-muted-foreground">
          <ChevronDown className="h-4 w-4" aria-hidden />
        </span>
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
