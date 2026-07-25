/**
 * هياكل تحميل أنيقة — متوافقة RTL و Dark Mode
 */
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-muted/80 dark:bg-muted/50",
        className,
      )}
      aria-hidden
    />
  );
}

/** رأس صفحة: عنوان + وصف + أزرار */
export function PageHeaderSkeleton({
  withActions = true,
}: {
  withActions?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withActions ? (
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      ) : null}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: cols }).map((__, col) => (
              <Skeleton key={col} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
          <Skeleton className="mt-4 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

export function CardsGridSkeleton({
  count = 6,
  cols = "md:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={cn("grid gap-4", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="flex justify-between gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <Skeleton className="h-5 w-36" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-32 rounded-xl" />
    </div>
  );
}

/** هيكل كامل لصفحة قائمة قياسية */
export function ListPageSkeleton({
  stats = 4,
  variant = "table",
}: {
  stats?: number;
  variant?: "table" | "cards" | "form";
}) {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <PageHeaderSkeleton />
      {stats > 0 ? <StatCardsSkeleton count={stats} /> : null}
      <FiltersSkeleton />
      {variant === "table" ? (
        <TableSkeleton />
      ) : variant === "cards" ? (
        <CardsGridSkeleton />
      ) : (
        <FormSkeleton />
      )}
    </div>
  );
}

/** لوحة التحكم */
export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <PageHeaderSkeleton withActions={false} />
      <StatCardsSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TableSkeleton rows={4} cols={4} />
        <TableSkeleton rows={4} cols={3} />
      </div>
    </div>
  );
}

/** الحضور */
export function AttendanceSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <PageHeaderSkeleton withActions={false} />
      <StatCardsSkeleton count={4} />
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <TableSkeleton rows={5} cols={2} />
      </div>
    </div>
  );
}

/** الإعدادات */
export function SettingsSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <PageHeaderSkeleton withActions={false} />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      <FormSkeleton fields={6} />
    </div>
  );
}
