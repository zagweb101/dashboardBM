import type { SelectHTMLAttributes, ReactNode } from "react";
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
    <label className="block space-y-1.5" htmlFor={selectId}>
      {label ? <span className="text-sm font-semibold">{label}</span> : null}
      <div className="relative">
        {startIcon ? (
          <span className="pointer-events-none absolute top-1/2 start-3 z-10 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </span>
        ) : null}
        <select
          id={selectId}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-border bg-background text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15",
            startIcon ? "ps-10 pe-9" : "ps-3 pe-9",
            error && "border-danger focus:border-danger focus:ring-danger/15",
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
        <span className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground">
          ▾
        </span>
      </div>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
