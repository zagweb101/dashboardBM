/**
 * تحويل صفوف PostgreSQL (snake_case) → أنواع التطبيق (camelCase)
 */
import type { Profile, Organization } from "@/types/database";
import type { Role } from "@/types/rbac";
import type { Student } from "@/types/student";
import type { Course, Enrollment } from "@/types/course";
import type { AttendanceRecord } from "@/types/attendance";
import type { StudentPayment } from "@/types/payment";
import type { Customer } from "@/types/customer";
import type { Report, ReportFilters } from "@/types/report";

export function toIso(value: unknown, fallback = ""): string {
  if (value == null || value === "") return fallback;
  if (value instanceof Date) return value.toISOString();
  const s = String(value);
  // DATE only → أبقِ التاريخ كما هو إن لم يكن ISO كاملاً
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
}

export function toDateOnly(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function toNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    ownerId: String(row.owner_id ?? ""),
    createdAt: toIso(row.created_at),
  };
}

export function mapProfile(row: Record<string, unknown>): Profile {
  const themeRaw = String(row.theme ?? "system");
  const theme =
    themeRaw === "light" || themeRaw === "dark" || themeRaw === "system"
      ? themeRaw
      : "system";

  return {
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.full_name ?? row.name ?? ""),
    phone: row.phone ? String(row.phone) : undefined,
    avatarUrl:
      (row.avatar_url as string | null) ??
      (row.image as string | null) ??
      null,
    role: String(row.role ?? "viewer") as Role,
    organizationId: String(row.organization_id ?? ""),
    locale: row.locale === "en" ? "en" : "ar",
    theme,
    createdAt: toIso(row.created_at),
    updatedAt: row.updated_at ? toIso(row.updated_at) : undefined,
  };
}

export function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    code: String(row.code),
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone),
    nationalId: row.national_id ? String(row.national_id) : undefined,
    gender: row.gender as Student["gender"],
    dateOfBirth: toDateOnly(row.date_of_birth),
    city: String(row.city ?? ""),
    address: row.address ? String(row.address) : undefined,
    status: row.status as Student["status"],
    level: row.level as Student["level"],
    source: row.source as Student["source"],
    notes: row.notes ? String(row.notes) : undefined,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    emergencyContactName: row.emergency_contact_name
      ? String(row.emergency_contact_name)
      : undefined,
    emergencyContactPhone: row.emergency_contact_phone
      ? String(row.emergency_contact_phone)
      : undefined,
    enrolledCoursesCount: toNum(row.enrolled_courses_count),
    totalPaid: toNum(row.total_paid),
    lastAttendanceAt: row.last_attendance_at
      ? toIso(row.last_attendance_at)
      : null,
    joinedAt: toIso(row.joined_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    code: String(row.code),
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    category: row.category as Course["category"],
    level: row.level as Course["level"],
    status: row.status as Course["status"],
    price: toNum(row.price),
    durationHours: toNum(row.duration_hours),
    sessionsCount: toNum(row.sessions_count),
    maxSeats: toNum(row.max_seats),
    instructorName: row.instructor_name
      ? String(row.instructor_name)
      : undefined,
    startDate: toDateOnly(row.start_date),
    endDate: toDateOnly(row.end_date),
    scheduleNote: row.schedule_note ? String(row.schedule_note) : undefined,
    enrolledCount: toNum(row.enrolled_count),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapEnrollment(row: Record<string, unknown>): Enrollment {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    courseId: String(row.course_id),
    studentId: String(row.student_id),
    status: row.status as Enrollment["status"],
    priceAgreed: toNum(row.price_agreed),
    amountPaid: toNum(row.amount_paid),
    enrolledAt: toIso(row.enrolled_at),
    completedAt: row.completed_at ? toIso(row.completed_at) : null,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapAttendance(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    courseId: String(row.course_id),
    studentId: String(row.student_id),
    enrollmentId: row.enrollment_id ? String(row.enrollment_id) : null,
    sessionDate: toDateOnly(row.session_date) ?? String(row.session_date),
    sessionNumber:
      row.session_number != null ? toNum(row.session_number) : null,
    status: row.status as AttendanceRecord["status"],
    notes: row.notes ? String(row.notes) : undefined,
    recordedBy: row.recorded_by ? String(row.recorded_by) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapPayment(row: Record<string, unknown>): StudentPayment {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    studentId: String(row.student_id),
    enrollmentId: row.enrollment_id ? String(row.enrollment_id) : null,
    courseId: row.course_id ? String(row.course_id) : null,
    amount: toNum(row.amount),
    currency: "SAR",
    method: row.method as StudentPayment["method"],
    status: row.status as StudentPayment["status"],
    paidAt: toIso(row.paid_at),
    reference: row.reference ? String(row.reference) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : undefined,
    company: row.company ? String(row.company) : undefined,
    status: row.status as Customer["status"],
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapReport(row: Record<string, unknown>): Report {
  let filters: ReportFilters = {};
  const raw = row.filters;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    filters = raw as ReportFilters;
  } else if (typeof raw === "string") {
    try {
      filters = JSON.parse(raw) as ReportFilters;
    } catch {
      filters = {};
    }
  }

  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    title: String(row.title),
    type: row.type as Report["type"],
    filters,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdByName: row.created_by_name
      ? String(row.created_by_name)
      : row.full_name
        ? String(row.full_name)
        : null,
    createdAt: toIso(row.created_at),
  };
}
