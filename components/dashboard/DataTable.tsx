"use client";

/**
 * جدول متجاوب — Client Component
 *
 * ⚠️ لا تمرّر `cell` أو دوال من Server Component.
 * عرّف columns داخل Client Component فقط.
 * rowKeyField: اسم حقل string (مثل "id") — قابل للتسلسل.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  hideOnMobileCard?: boolean;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  /** اسم حقل المفتاح — افتراضي "id" (ليس function) */
  rowKeyField?: string;
  action?: ReactNode;
  className?: string;
  emptyMessage?: string;
};

export function DataTable<T>({
  title,
  description,
  columns,
  data,
  rowKeyField = "id",
  action,
  className,
  emptyMessage = "لا توجد بيانات حالياً",
}: DataTableProps<T>) {
  const mobileColumns = columns.filter((c) => !c.hideOnMobileCard);

  function getRowKey(row: T, index: number): string {
    const record = row as Record<string, unknown>;
    const value = record[rowKeyField];
    if (value == null) return `row-${index}`;
    return String(value);
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-bold text-card-foreground">{title}</h3>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {data.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border md:hidden">
            {data.map((row, index) => (
              <li key={getRowKey(row, index)} className="space-y-2.5 px-4 py-4">
                {mobileColumns.map((col) => (
                  <div
                    key={col.key}
                    className="flex min-w-0 items-start justify-between gap-3"
                  >
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {col.header}
                    </span>
                    <div
                      className={cn(
                        "min-w-0 max-w-[65%] text-end text-sm text-card-foreground",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </div>
                  </div>
                ))}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-start text-xs font-semibold tracking-wide whitespace-nowrap sm:px-5",
                        col.className,
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr
                    key={getRowKey(row, index)}
                    className="border-t border-border transition hover:bg-muted/30"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "max-w-[220px] px-4 py-3.5 align-middle text-card-foreground sm:px-5",
                          col.className,
                        )}
                      >
                        <div className="min-w-0 break-words">
                          {col.cell(row)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
