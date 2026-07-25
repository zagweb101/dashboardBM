import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: ReactNode;
  accent?: string;
  className?: string;
};

export function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  accent,
  className,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-muted-foreground";

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            accent ?? "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={cn("font-semibold", trendColor)}>{change}</span>
        <span className="text-muted-foreground">vs previous period</span>
      </div>
    </article>
  );
}
