import type { Locale } from "@/lib/i18n/translations";
import type { ReportType } from "@/types/report";

export const reportTypeLabels: Record<ReportType, { ar: string; en: string }> =
  {
    sales: { ar: "مبيعات", en: "Sales" },
    attendance: { ar: "حضور", en: "Attendance" },
    financial: { ar: "مالي", en: "Financial" },
    custom: { ar: "مخصص", en: "Custom" },
  };

export function labelReportType(t: ReportType, locale: Locale) {
  return reportTypeLabels[t][locale];
}

export const reportTypeTone: Record<
  ReportType,
  "success" | "default" | "warning" | "info" | "danger"
> = {
  sales: "success",
  attendance: "info",
  financial: "warning",
  custom: "default",
};
