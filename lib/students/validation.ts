import type {
  StudentGender,
  StudentInput,
  StudentLevel,
  StudentSource,
  StudentStatus,
} from "@/types/student";
import {
  STUDENT_GENDERS,
  STUDENT_LEVELS,
  STUDENT_SOURCES,
  STUDENT_STATUSES,
} from "@/types/student";

export type StudentFieldErrors = Partial<Record<keyof StudentInput, string>>;

export type StudentValidationResult =
  | { success: true; data: StudentInput }
  | { success: false; errors: StudentFieldErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(05|5|\+9665|9665)\d{8}$/;

function isOneOf<T extends string>(value: string, list: readonly T[]): value is T {
  return (list as readonly string[]).includes(value);
}

function clean(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: FormDataEntryValue | null | undefined): string | undefined {
  const v = clean(value);
  return v.length ? v : undefined;
}

/**
 * Lightweight form validation (Zod-compatible shape later).
 * Keeps deps lean while delivering field-level AR/EN messages via message keys.
 */
export function validateStudentInput(
  raw: Record<string, unknown>,
  locale: "ar" | "en" = "ar",
): StudentValidationResult {
  const errors: StudentFieldErrors = {};
  const msg = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const fullName = String(raw.fullName ?? "").trim();
  const email = String(raw.email ?? "").trim().toLowerCase();
  const phone = String(raw.phone ?? "").trim().replace(/[\s-]/g, "");
  const nationalId = String(raw.nationalId ?? "").trim() || undefined;
  const gender = String(raw.gender ?? "").trim();
  const dateOfBirth = String(raw.dateOfBirth ?? "").trim() || undefined;
  const city = String(raw.city ?? "").trim();
  const address = String(raw.address ?? "").trim() || undefined;
  const status = String(raw.status ?? "active").trim();
  const level = String(raw.level ?? "beginner").trim();
  const source = String(raw.source ?? "walk_in").trim();
  const notes = String(raw.notes ?? "").trim() || undefined;
  const emergencyContactName =
    String(raw.emergencyContactName ?? "").trim() || undefined;
  const emergencyContactPhone =
    String(raw.emergencyContactPhone ?? "")
      .trim()
      .replace(/[\s-]/g, "") || undefined;

  if (fullName.length < 3) {
    errors.fullName = msg("الاسم يجب ألا يقل عن 3 أحرف", "Name must be at least 3 characters");
  }

  if (!EMAIL_RE.test(email)) {
    errors.email = msg("البريد الإلكتروني غير صالح", "Enter a valid email address");
  }

  if (!PHONE_RE.test(phone)) {
    errors.phone = msg(
      "رقم الجوال غير صالح (مثال: 05xxxxxxxx)",
      "Invalid mobile number (e.g. 05xxxxxxxx)",
    );
  }

  if (nationalId && !/^\d{10}$/.test(nationalId)) {
    errors.nationalId = msg(
      "رقم الهوية يجب أن يكون 10 أرقام",
      "National ID must be 10 digits",
    );
  }

  if (!isOneOf(gender, STUDENT_GENDERS)) {
    errors.gender = msg("اختر الجنس", "Select a gender");
  }

  if (!city) {
    errors.city = msg("المدينة مطلوبة", "City is required");
  }

  if (!isOneOf(status, STUDENT_STATUSES)) {
    errors.status = msg("الحالة غير صالحة", "Invalid status");
  }

  if (!isOneOf(level, STUDENT_LEVELS)) {
    errors.level = msg("المستوى غير صالح", "Invalid level");
  }

  if (!isOneOf(source, STUDENT_SOURCES)) {
    errors.source = msg("مصدر التسجيل غير صالح", "Invalid acquisition source");
  }

  if (dateOfBirth && Number.isNaN(Date.parse(dateOfBirth))) {
    errors.dateOfBirth = msg("تاريخ الميلاد غير صالح", "Invalid date of birth");
  }

  if (emergencyContactPhone && !PHONE_RE.test(emergencyContactPhone)) {
    errors.emergencyContactPhone = msg(
      "هاتف الطوارئ غير صالح",
      "Invalid emergency phone",
    );
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      fullName,
      email,
      phone,
      nationalId,
      gender: gender as StudentGender,
      dateOfBirth,
      city,
      address,
      status: status as StudentStatus,
      level: level as StudentLevel,
      source: source as StudentSource,
      notes,
      emergencyContactName,
      emergencyContactPhone,
    },
  };
}

export function studentInputFromFormData(formData: FormData): Record<string, unknown> {
  return {
    fullName: clean(formData.get("fullName")),
    email: clean(formData.get("email")),
    phone: clean(formData.get("phone")),
    nationalId: optional(formData.get("nationalId")),
    gender: clean(formData.get("gender")),
    dateOfBirth: optional(formData.get("dateOfBirth")),
    city: clean(formData.get("city")),
    address: optional(formData.get("address")),
    status: clean(formData.get("status")) || "active",
    level: clean(formData.get("level")) || "beginner",
    source: clean(formData.get("source")) || "walk_in",
    notes: optional(formData.get("notes")),
    emergencyContactName: optional(formData.get("emergencyContactName")),
    emergencyContactPhone: optional(formData.get("emergencyContactPhone")),
  };
}
