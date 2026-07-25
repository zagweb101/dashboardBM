import type { Locale } from "@/lib/i18n/translations";
import type {
  CourseCategory,
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
} from "@/types/course";
import type { AttendanceStatus } from "@/types/attendance";
import type { PaymentMethod, PaymentStatus } from "@/types/payment";

type Dict<T extends string> = Record<T, { ar: string; en: string }>;

export const courseStatusLabels: Dict<CourseStatus> = {
  draft: { ar: "مسودة", en: "Draft" },
  open: { ar: "مفتوحة", en: "Open" },
  full: { ar: "مكتملة العدد", en: "Full" },
  in_progress: { ar: "جارية", en: "In progress" },
  completed: { ar: "منتهية", en: "Completed" },
  cancelled: { ar: "ملغاة", en: "Cancelled" },
};

export const courseCategoryLabels: Dict<CourseCategory> = {
  basics: { ar: "أساسيات", en: "Basics" },
  portrait: { ar: "بورتريه", en: "Portrait" },
  landscape: { ar: "مناظر", en: "Landscape" },
  studio: { ar: "استوديو", en: "Studio" },
  product: { ar: "منتجات", en: "Product" },
  wedding: { ar: "أعراس", en: "Wedding" },
  video: { ar: "فيديو", en: "Video" },
  editing: { ar: "تحرير", en: "Editing" },
  other: { ar: "أخرى", en: "Other" },
};

export const courseLevelLabels: Dict<CourseLevel> = {
  beginner: { ar: "مبتدئ", en: "Beginner" },
  intermediate: { ar: "متوسط", en: "Intermediate" },
  advanced: { ar: "متقدم", en: "Advanced" },
  professional: { ar: "احترافي", en: "Professional" },
};

export const enrollmentStatusLabels: Dict<EnrollmentStatus> = {
  pending: { ar: "بانتظار", en: "Pending" },
  active: { ar: "نشط", en: "Active" },
  completed: { ar: "مكتمل", en: "Completed" },
  dropped: { ar: "منسحب", en: "Dropped" },
  refunded: { ar: "مسترد", en: "Refunded" },
};

export const attendanceStatusLabels: Dict<AttendanceStatus> = {
  present: { ar: "حاضر", en: "Present" },
  absent: { ar: "غائب", en: "Absent" },
  late: { ar: "متأخر", en: "Late" },
  excused: { ar: "بعذر", en: "Excused" },
};

export const paymentMethodLabels: Dict<PaymentMethod> = {
  cash: { ar: "نقداً", en: "Cash" },
  card: { ar: "بطاقة", en: "Card" },
  transfer: { ar: "تحويل", en: "Bank transfer" },
  stc_pay: { ar: "STC Pay", en: "STC Pay" },
  apple_pay: { ar: "Apple Pay", en: "Apple Pay" },
  other: { ar: "أخرى", en: "Other" },
};

export const paymentStatusLabels: Dict<PaymentStatus> = {
  pending: { ar: "بانتظار", en: "Pending" },
  completed: { ar: "مكتمل", en: "Completed" },
  failed: { ar: "فشل", en: "Failed" },
  refunded: { ar: "مسترد", en: "Refunded" },
};

export function labelCourseStatus(s: CourseStatus, locale: Locale) {
  return courseStatusLabels[s][locale];
}
export function labelCourseCategory(c: CourseCategory, locale: Locale) {
  return courseCategoryLabels[c][locale];
}
export function labelCourseLevel(l: CourseLevel, locale: Locale) {
  return courseLevelLabels[l][locale];
}
export function labelEnrollmentStatus(s: EnrollmentStatus, locale: Locale) {
  return enrollmentStatusLabels[s][locale];
}
export function labelAttendanceStatus(s: AttendanceStatus, locale: Locale) {
  return attendanceStatusLabels[s][locale];
}
export function labelPaymentMethod(m: PaymentMethod, locale: Locale) {
  return paymentMethodLabels[m][locale];
}
export function labelPaymentStatus(s: PaymentStatus, locale: Locale) {
  return paymentStatusLabels[s][locale];
}

export const courseStatusTone: Record<
  CourseStatus,
  "success" | "default" | "info" | "warning" | "danger"
> = {
  draft: "default",
  open: "success",
  full: "warning",
  in_progress: "info",
  completed: "default",
  cancelled: "danger",
};

export const enrollmentStatusTone: Record<
  EnrollmentStatus,
  "success" | "default" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  active: "success",
  completed: "info",
  dropped: "default",
  refunded: "danger",
};

export const attendanceStatusTone: Record<
  AttendanceStatus,
  "success" | "default" | "info" | "warning" | "danger"
> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
};

export const paymentStatusTone: Record<
  PaymentStatus,
  "success" | "default" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  completed: "success",
  failed: "danger",
  refunded: "default",
};
