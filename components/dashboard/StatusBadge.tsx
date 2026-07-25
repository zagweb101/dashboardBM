import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  قادم: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  جاري: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  مكتمل: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "قيد الانتظار":
    "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  فاشل: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  نشط: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  معلق: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  "غير نشط": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
