"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  REPORT_TYPES,
  type Report,
  type ReportInput,
  type ReportType,
} from "@/types/report";

export type ReportActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  report?: Report;
};

function localeOf(user: { locale?: string }) {
  return user.locale === "en" ? "en" : "ar";
}

export async function createReportAction(
  _prev: ReportActionState | null,
  formData: FormData,
): Promise<ReportActionState> {
  const user = await requirePermission("reports:export");
  const locale = localeOf(user);
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "custom").trim();
  const filtersRaw = String(formData.get("filters") ?? "").trim();

  const errors: Record<string, string> = {};
  if (title.length < 3) {
    errors.title =
      locale === "ar" ? "العنوان قصير جداً" : "Title is too short";
  }
  if (!(REPORT_TYPES as readonly string[]).includes(type)) {
    errors.type = locale === "ar" ? "نوع غير صالح" : "Invalid type";
  }

  let filters: Record<string, unknown> = {};
  if (filtersRaw) {
    try {
      filters = JSON.parse(filtersRaw) as Record<string, unknown>;
    } catch {
      errors.filters =
        locale === "ar"
          ? "JSON الفلاتر غير صالح"
          : "Invalid filters JSON";
    }
  }

  if (Object.keys(errors).length) {
    return {
      success: false,
      error: locale === "ar" ? "صحّح الحقول" : "Fix the fields",
      fieldErrors: errors,
    };
  }

  const input: ReportInput = {
    title,
    type: type as ReportType,
    filters,
  };

  try {
    const report = await db.createReport(
      user.organizationId,
      input,
      user.id,
    );
    revalidatePath("/reports");
    return { success: true, report };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function deleteReportAction(
  id: string,
): Promise<ReportActionState> {
  const user = await requirePermission("reports:export");
  const existing = await db.getReportById(id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return { success: false, error: "Not found" };
  }
  await db.deleteReport(id);
  revalidatePath("/reports");
  return { success: true };
}
