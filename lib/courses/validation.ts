import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  COURSE_STATUSES,
  type CourseInput,
} from "@/types/course";
import {
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "@/types/attendance";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type StudentPaymentInput,
} from "@/types/payment";

export type FieldErrors = Record<string, string>;

function isOneOf<T extends string>(value: string, list: readonly T[]): value is T {
  return (list as readonly string[]).includes(value);
}

function clean(v: FormDataEntryValue | null | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function msg(locale: "ar" | "en", ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export function courseInputFromFormData(formData: FormData): Record<string, unknown> {
  return {
    title: clean(formData.get("title")),
    description: clean(formData.get("description")) || undefined,
    category: clean(formData.get("category")),
    level: clean(formData.get("level")),
    status: clean(formData.get("status")),
    price: clean(formData.get("price")),
    durationHours: clean(formData.get("durationHours")),
    sessionsCount: clean(formData.get("sessionsCount")),
    maxSeats: clean(formData.get("maxSeats")),
    instructorName: clean(formData.get("instructorName")) || undefined,
    startDate: clean(formData.get("startDate")) || undefined,
    endDate: clean(formData.get("endDate")) || undefined,
    scheduleNote: clean(formData.get("scheduleNote")) || undefined,
  };
}

export function validateCourseInput(
  raw: Record<string, unknown>,
  locale: "ar" | "en" = "ar",
): { success: true; data: CourseInput } | { success: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const title = String(raw.title ?? "").trim();
  const category = String(raw.category ?? "").trim();
  const level = String(raw.level ?? "").trim();
  const status = String(raw.status ?? "draft").trim();
  const price = Number(raw.price);
  const durationHours = Number(raw.durationHours);
  const sessionsCount = Number(raw.sessionsCount);
  const maxSeats = Number(raw.maxSeats);

  if (title.length < 3) {
    errors.title = msg(locale, "عنوان الدورة قصير جداً", "Course title is too short");
  }
  if (!isOneOf(category, COURSE_CATEGORIES)) {
    errors.category = msg(locale, "التصنيف غير صالح", "Invalid category");
  }
  if (!isOneOf(level, COURSE_LEVELS)) {
    errors.level = msg(locale, "المستوى غير صالح", "Invalid level");
  }
  if (!isOneOf(status, COURSE_STATUSES)) {
    errors.status = msg(locale, "الحالة غير صالحة", "Invalid status");
  }
  if (!Number.isFinite(price) || price < 0) {
    errors.price = msg(locale, "السعر غير صالح", "Invalid price");
  }
  if (!Number.isFinite(durationHours) || durationHours < 1) {
    errors.durationHours = msg(locale, "عدد الساعات غير صالح", "Invalid duration");
  }
  if (!Number.isFinite(sessionsCount) || sessionsCount < 1) {
    errors.sessionsCount = msg(locale, "عدد الجلسات غير صالح", "Invalid sessions count");
  }
  if (!Number.isFinite(maxSeats) || maxSeats < 1) {
    errors.maxSeats = msg(locale, "عدد المقاعد غير صالح", "Invalid seats");
  }

  if (Object.keys(errors).length) return { success: false, errors };

  return {
    success: true,
    data: {
      title,
      description: raw.description ? String(raw.description) : undefined,
      category: category as CourseInput["category"],
      level: level as CourseInput["level"],
      status: status as CourseInput["status"],
      price,
      durationHours,
      sessionsCount,
      maxSeats,
      instructorName: raw.instructorName ? String(raw.instructorName) : undefined,
      startDate: raw.startDate ? String(raw.startDate) : undefined,
      endDate: raw.endDate ? String(raw.endDate) : undefined,
      scheduleNote: raw.scheduleNote ? String(raw.scheduleNote) : undefined,
    },
  };
}

export function paymentInputFromFormData(
  formData: FormData,
): Record<string, unknown> {
  return {
    studentId: clean(formData.get("studentId")),
    enrollmentId: clean(formData.get("enrollmentId")) || undefined,
    courseId: clean(formData.get("courseId")) || undefined,
    amount: clean(formData.get("amount")),
    method: clean(formData.get("method")),
    status: clean(formData.get("status")) || "completed",
    paidAt: clean(formData.get("paidAt")) || undefined,
    reference: clean(formData.get("reference")) || undefined,
    notes: clean(formData.get("notes")) || undefined,
  };
}

export function validatePaymentInput(
  raw: Record<string, unknown>,
  locale: "ar" | "en" = "ar",
):
  | { success: true; data: StudentPaymentInput }
  | { success: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const studentId = String(raw.studentId ?? "").trim();
  const amount = Number(raw.amount);
  const method = String(raw.method ?? "").trim();
  const status = String(raw.status ?? "completed").trim();

  if (!studentId) {
    errors.studentId = msg(locale, "اختر المتدرب", "Select a student");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = msg(locale, "المبلغ غير صالح", "Invalid amount");
  }
  if (!isOneOf(method, PAYMENT_METHODS)) {
    errors.method = msg(locale, "طريقة الدفع غير صالحة", "Invalid payment method");
  }
  if (!isOneOf(status, PAYMENT_STATUSES)) {
    errors.status = msg(locale, "الحالة غير صالحة", "Invalid status");
  }

  if (Object.keys(errors).length) return { success: false, errors };

  return {
    success: true,
    data: {
      studentId,
      enrollmentId: raw.enrollmentId ? String(raw.enrollmentId) : undefined,
      courseId: raw.courseId ? String(raw.courseId) : undefined,
      amount,
      method: method as StudentPaymentInput["method"],
      status: status as StudentPaymentInput["status"],
      paidAt: raw.paidAt ? String(raw.paidAt) : undefined,
      reference: raw.reference ? String(raw.reference) : undefined,
      notes: raw.notes ? String(raw.notes) : undefined,
    },
  };
}

export function isAttendanceStatus(v: string): v is AttendanceStatus {
  return isOneOf(v, ATTENDANCE_STATUSES);
}
