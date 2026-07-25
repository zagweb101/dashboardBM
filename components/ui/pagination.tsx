"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  labels?: {
    previous: string;
    next: string;
    of: string;
    showing: string;
  };
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  labels = {
    previous: "السابق",
    next: "التالي",
    of: "من",
    showing: "عرض",
  },
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        {labels.showing}{" "}
        <span className="font-semibold text-foreground">
          {from}–{to}
        </span>{" "}
        {labels.of} <span className="font-semibold text-foreground">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label={labels.previous}
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          <span className="hidden sm:inline">{labels.previous}</span>
        </Button>
        <span className="min-w-16 text-center text-xs font-semibold tabular-nums">
          {current} / {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          aria-label={labels.next}
        >
          <span className="hidden sm:inline">{labels.next}</span>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
