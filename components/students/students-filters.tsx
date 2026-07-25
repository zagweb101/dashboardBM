"use client";

import { Search, X } from "lucide-react";
import {
  STUDENT_GENDERS,
  STUDENT_LEVELS,
  STUDENT_SOURCES,
  STUDENT_STATUSES,
  type StudentFilters,
  type StudentGender,
  type StudentLevel,
  type StudentSource,
  type StudentStatus,
} from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import {
  labelStudentGender,
  labelStudentLevel,
  labelStudentSource,
  labelStudentStatus,
} from "@/lib/students/labels";

type StudentsFiltersProps = {
  value: StudentFilters;
  cities: string[];
  onChange: (next: StudentFilters) => void;
  onReset: () => void;
};

export function StudentsFilters({
  value,
  cities,
  onChange,
  onReset,
}: StudentsFiltersProps) {
  const { locale, t } = useLanguage();

  const allLabel = t("all");

  const hasActiveFilters =
    Boolean(value.query?.trim()) ||
    (value.status && value.status !== "all") ||
    (value.level && value.level !== "all") ||
    (value.source && value.source !== "all") ||
    (value.gender && value.gender !== "all") ||
    (value.city && value.city !== "all");

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="md:col-span-2 xl:col-span-2">
          <Input
            value={value.query ?? ""}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            placeholder={t("searchStudents")}
            startIcon={<Search className="h-4 w-4" />}
            aria-label={t("searchStudents")}
          />
        </div>

        <Select
          value={value.status ?? "all"}
          onChange={(e) =>
            onChange({
              ...value,
              status: e.target.value as StudentStatus | "all",
            })
          }
          options={[
            { value: "all", label: `${allLabel} — ${t("status")}` },
            ...STUDENT_STATUSES.map((s) => ({
              value: s,
              label: labelStudentStatus(s, locale),
            })),
          ]}
          aria-label={t("status")}
        />

        <Select
          value={value.level ?? "all"}
          onChange={(e) =>
            onChange({
              ...value,
              level: e.target.value as StudentLevel | "all",
            })
          }
          options={[
            { value: "all", label: `${allLabel} — ${t("level")}` },
            ...STUDENT_LEVELS.map((s) => ({
              value: s,
              label: labelStudentLevel(s, locale),
            })),
          ]}
          aria-label={t("level")}
        />

        <Select
          value={value.source ?? "all"}
          onChange={(e) =>
            onChange({
              ...value,
              source: e.target.value as StudentSource | "all",
            })
          }
          options={[
            { value: "all", label: `${allLabel} — ${t("source")}` },
            ...STUDENT_SOURCES.map((s) => ({
              value: s,
              label: labelStudentSource(s, locale),
            })),
          ]}
          aria-label={t("source")}
        />

        <Select
          value={value.city ?? "all"}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          options={[
            { value: "all", label: `${allLabel} — ${t("city")}` },
            ...cities.map((city) => ({ value: city, label: city })),
          ]}
          aria-label={t("city")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Select
          value={value.gender ?? "all"}
          onChange={(e) =>
            onChange({
              ...value,
              gender: e.target.value as StudentGender | "all",
            })
          }
          className="w-full sm:w-48"
          options={[
            { value: "all", label: `${allLabel} — ${t("gender")}` },
            ...STUDENT_GENDERS.map((s) => ({
              value: s,
              label: labelStudentGender(s, locale),
            })),
          ]}
          aria-label={t("gender")}
        />

        {hasActiveFilters ? (
          <Button type="button" size="sm" variant="ghost" onClick={onReset}>
            <X className="h-4 w-4" />
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
