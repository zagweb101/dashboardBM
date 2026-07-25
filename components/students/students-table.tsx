"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  Student,
  StudentSort,
  StudentSortKey,
} from "@/types/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyIcon, EmptyState, getEmptyCopy } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { useLanguage } from "@/components/providers/language-provider";
import {
  labelStudentLevel,
  labelStudentSource,
  labelStudentStatus,
  studentStatusTone,
} from "@/lib/students/labels";
import {
  cn,
  formatCurrency,
  formatDate,
  formatPhone,
  getInitials,
} from "@/lib/utils";

type StudentsTableProps = {
  students: Student[];
  sort: StudentSort;
  page: number;
  pageSize: number;
  total: number;
  canEdit: boolean;
  canDelete: boolean;
  onSortChange: (sort: StudentSort) => void;
  onPageChange: (page: number) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onView: (student: Student) => void;
};

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
  return direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

export function StudentsTable({
  students,
  sort,
  page,
  pageSize,
  total,
  canEdit,
  canDelete,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete,
  onView,
}: StudentsTableProps) {
  const { locale, t } = useLanguage();

  function toggleSort(key: StudentSortKey) {
    if (sort.key === key) {
      onSortChange({
        key,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
      return;
    }
    onSortChange({ key, direction: "asc" });
  }

  const headers: Array<{ key: StudentSortKey | "actions" | "contact"; label: string; sortable?: boolean }> = [
    { key: "fullName", label: t("student"), sortable: true },
    { key: "contact", label: t("contact") },
    { key: "status", label: t("status"), sortable: true },
    { key: "level", label: t("level"), sortable: true },
    { key: "enrolledCoursesCount", label: t("courses"), sortable: true },
    { key: "totalPaid", label: t("totalPaid"), sortable: true },
    { key: "joinedAt", label: t("joinedAt"), sortable: true },
    { key: "actions", label: t("actions") },
  ];

  if (students.length === 0) {
    return (
      <EmptyState
        compact
        icon={
          <EmptyIcon
            icon={getEmptyCopy("students", locale === "en" ? "en" : "ar").Icon}
          />
        }
        title={getEmptyCopy("students", locale === "en" ? "en" : "ar").title}
        description={
          getEmptyCopy("students", locale === "en" ? "en" : "ar").description
        }
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-base font-bold">{t("studentsDirectory")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {t("records")}
          </p>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              {headers.map((col) => {
                const sortable = Boolean(col.sortable);
                const active = sortable && sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-start font-semibold whitespace-nowrap"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key as StudentSortKey)}
                        className={cn(
                          "inline-flex items-center gap-1.5 transition hover:text-foreground",
                          active && "text-foreground",
                        )}
                      >
                        {col.label}
                        <SortIcon
                          active={active}
                          direction={sort.direction}
                        />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-t border-border transition hover:bg-muted/40"
              >
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onView(student)}
                    className="flex items-center gap-3 text-start transition hover:opacity-90"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(student.fullName)}
                    </span>
                    <span>
                      <span className="block font-semibold text-card-foreground">
                        {student.fullName}
                      </span>
                      <span className="block text-xs text-muted-foreground" dir="ltr">
                        {student.code}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-card-foreground" dir="ltr">
                    {formatPhone(student.phone)}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {student.email}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <Badge tone={studentStatusTone[student.status]}>
                    {labelStudentStatus(student.status, locale)}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <div>
                    <p className="font-medium">
                      {labelStudentLevel(student.level, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {labelStudentSource(student.source, locale)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {student.enrolledCoursesCount}
                </td>
                <td className="px-4 py-3.5 font-semibold tabular-nums">
                  {formatCurrency(student.totalPaid, locale)}
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">
                  {formatDate(student.joinedAt, locale)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 px-0"
                      onClick={() => onView(student)}
                      aria-label={t("view")}
                      title={t("view")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 px-0"
                        onClick={() => onEdit(student)}
                        aria-label={t("edit")}
                        title={t("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 px-0 text-danger hover:text-danger"
                        onClick={() => onDelete(student)}
                        aria-label={t("delete")}
                        title={t("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Link
                      href={`/students/${student.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label={t("openProfile")}
                      title={t("openProfile")}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        labels={{
          previous: t("previous"),
          next: t("next"),
          of: t("of"),
          showing: t("showing"),
        }}
      />
    </section>
  );
}
