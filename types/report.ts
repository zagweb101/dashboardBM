/** تقارير محفوظة / مولَّدة */

export const REPORT_TYPES = [
  "sales",
  "attendance",
  "financial",
  "custom",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportFilters = Record<string, unknown>;

export type Report = {
  id: string;
  organizationId: string;
  title: string;
  type: ReportType;
  filters: ReportFilters;
  createdBy?: string | null;
  createdAt: string;
  /** اسم المنشئ للعرض (join) */
  createdByName?: string | null;
};

export type ReportInput = {
  title: string;
  type: ReportType;
  filters?: ReportFilters;
};

/** توافق مع الكود القديم */
export type ReportSummary = Report & {
  category?: string;
  generatedAt?: string;
  status?: "ready" | "processing" | "failed";
};
