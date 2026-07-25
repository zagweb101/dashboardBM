import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5",
        className,
      )}
    >
      <header className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-bold leading-snug text-card-foreground break-words">
            {title}
          </h3>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground break-words">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("min-h-0 min-w-0 flex-1", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
