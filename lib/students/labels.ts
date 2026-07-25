import type { Locale } from "@/lib/i18n/translations";
import type {
  StudentGender,
  StudentLevel,
  StudentSource,
  StudentStatus,
} from "@/types/student";

type Dict<T extends string> = Record<T, { ar: string; en: string }>;

export const studentStatusLabels: Dict<StudentStatus> = {
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  graduated: { ar: "متخرج", en: "Graduated" },
  suspended: { ar: "موقوف", en: "Suspended" },
};

export const studentLevelLabels: Dict<StudentLevel> = {
  beginner: { ar: "مبتدئ", en: "Beginner" },
  intermediate: { ar: "متوسط", en: "Intermediate" },
  advanced: { ar: "متقدم", en: "Advanced" },
  professional: { ar: "احترافي", en: "Professional" },
};

export const studentSourceLabels: Dict<StudentSource> = {
  walk_in: { ar: "زيارة مباشرة", en: "Walk-in" },
  instagram: { ar: "إنستغرام", en: "Instagram" },
  snapchat: { ar: "سناب شات", en: "Snapchat" },
  tiktok: { ar: "تيك توك", en: "TikTok" },
  referral: { ar: "توصية", en: "Referral" },
  website: { ar: "الموقع", en: "Website" },
  other: { ar: "أخرى", en: "Other" },
};

export const studentGenderLabels: Dict<StudentGender> = {
  male: { ar: "ذكر", en: "Male" },
  female: { ar: "أنثى", en: "Female" },
};

export function labelStudentStatus(status: StudentStatus, locale: Locale) {
  return studentStatusLabels[status][locale];
}

export function labelStudentLevel(level: StudentLevel, locale: Locale) {
  return studentLevelLabels[level][locale];
}

export function labelStudentSource(source: StudentSource, locale: Locale) {
  return studentSourceLabels[source][locale];
}

export function labelStudentGender(gender: StudentGender, locale: Locale) {
  return studentGenderLabels[gender][locale];
}

export const studentStatusTone: Record<
  StudentStatus,
  "success" | "default" | "info" | "warning" | "danger"
> = {
  active: "success",
  inactive: "default",
  graduated: "info",
  suspended: "danger",
};
