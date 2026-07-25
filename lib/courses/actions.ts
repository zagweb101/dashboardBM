"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  courseInputFromFormData,
  isAttendanceStatus,
  paymentInputFromFormData,
  validateCourseInput,
  validatePaymentInput,
} from "@/lib/courses/validation";
import type { Course, Enrollment } from "@/types/course";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import type { StudentPayment } from "@/types/payment";

export type ActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  course?: Course;
  enrollment?: Enrollment;
  payment?: StudentPayment;
  records?: AttendanceRecord[];
};

function localeOf(user: { locale?: string }) {
  return user.locale === "en" ? "en" : "ar";
}

// ── Courses ────────────────────────────────────────────────────────────

export async function createCourseAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("courses:create");
  const locale = localeOf(user);
  const result = validateCourseInput(courseInputFromFormData(formData), locale);
  if (!result.success) {
    return {
      success: false,
      error: locale === "ar" ? "يرجى تصحيح الحقول" : "Please fix the fields",
      fieldErrors: result.errors,
    };
  }
  try {
    const course = await db.createCourse(user.organizationId, result.data);
    revalidatePath("/courses");
    return { success: true, course };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function updateCourseAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("courses:edit");
  const locale = localeOf(user);
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return {
      success: false,
      error: locale === "ar" ? "معرّف الدورة مفقود" : "Missing course id",
    };
  }
  const existing = await db.getCourse(id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return {
      success: false,
      error: locale === "ar" ? "الدورة غير موجودة" : "Course not found",
    };
  }
  const result = validateCourseInput(courseInputFromFormData(formData), locale);
  if (!result.success) {
    return {
      success: false,
      error: locale === "ar" ? "يرجى تصحيح الحقول" : "Please fix the fields",
      fieldErrors: result.errors,
    };
  }
  const course = await db.updateCourse(id, result.data);
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
  return { success: true, course: course ?? undefined };
}

export async function deleteCourseAction(id: string): Promise<ActionState> {
  const user = await requirePermission("courses:delete");
  const locale = localeOf(user);
  const existing = await db.getCourse(id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return {
      success: false,
      error: locale === "ar" ? "الدورة غير موجودة" : "Course not found",
    };
  }
  try {
    await db.deleteCourse(id);
    revalidatePath("/courses");
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.message === "COURSE_HAS_ENROLLMENTS") {
      return {
        success: false,
        error:
          locale === "ar"
            ? "لا يمكن حذف دورة فيها تسجيلات نشطة"
            : "Cannot delete a course with active enrollments",
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

// ── Enrollments ────────────────────────────────────────────────────────

export async function enrollStudentAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("courses:edit");
  const locale = localeOf(user);
  const courseId = String(formData.get("courseId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const priceRaw = String(formData.get("priceAgreed") ?? "").trim();
  const priceAgreed = priceRaw ? Number(priceRaw) : undefined;

  if (!courseId || !studentId) {
    return {
      success: false,
      error:
        locale === "ar" ? "اختر الدورة والمتدرب" : "Select course and student",
    };
  }

  try {
    const enrollment = await db.createEnrollment(user.organizationId, {
      courseId,
      studentId,
      priceAgreed: Number.isFinite(priceAgreed) ? priceAgreed : undefined,
      notes,
    });
    revalidatePath("/courses");
    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/students");
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/attendance");
    return { success: true, enrollment };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    const map: Record<string, { ar: string; en: string }> = {
      ALREADY_ENROLLED: {
        ar: "المتدرب مسجّل مسبقاً في هذه الدورة",
        en: "Student is already enrolled in this course",
      },
      COURSE_FULL: {
        ar: "الدورة مكتملة العدد",
        en: "Course is full",
      },
      COURSE_NOT_FOUND: {
        ar: "الدورة غير موجودة",
        en: "Course not found",
      },
      STUDENT_NOT_FOUND: {
        ar: "المتدرب غير موجود",
        en: "Student not found",
      },
    };
    const m = map[code];
    return {
      success: false,
      error: m ? m[locale] : code || "Failed",
    };
  }
}

export async function updateEnrollmentStatusAction(
  enrollmentId: string,
  status: string,
): Promise<ActionState> {
  const user = await requirePermission("courses:edit");
  const locale = localeOf(user);
  const allowed = ["pending", "active", "completed", "dropped", "refunded"];
  if (!allowed.includes(status)) {
    return {
      success: false,
      error: locale === "ar" ? "حالة غير صالحة" : "Invalid status",
    };
  }
  const existing = await db.getEnrollment(enrollmentId);
  if (!existing || existing.organizationId !== user.organizationId) {
    return {
      success: false,
      error: locale === "ar" ? "التسجيل غير موجود" : "Enrollment not found",
    };
  }
  const enrollment = await db.updateEnrollmentStatus(
    enrollmentId,
    status as Enrollment["status"],
  );
  revalidatePath("/courses");
  revalidatePath(`/courses/${existing.courseId}`);
  revalidatePath(`/students/${existing.studentId}`);
  return { success: true, enrollment: enrollment ?? undefined };
}

// ── Attendance ─────────────────────────────────────────────────────────

export async function saveAttendanceSessionAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("attendance:manage");
  const locale = localeOf(user);
  const courseId = String(formData.get("courseId") ?? "");
  const sessionDate = String(formData.get("sessionDate") ?? "");
  const sessionNumberRaw = String(formData.get("sessionNumber") ?? "").trim();
  const sessionNumber = sessionNumberRaw ? Number(sessionNumberRaw) : undefined;
  const payloadRaw = String(formData.get("payload") ?? "[]");

  if (!courseId || !sessionDate) {
    return {
      success: false,
      error:
        locale === "ar"
          ? "اختر الدورة وتاريخ الجلسة"
          : "Select course and session date",
    };
  }

  let items: Array<{
    studentId: string;
    enrollmentId?: string;
    status: string;
    notes?: string;
  }> = [];
  try {
    items = JSON.parse(payloadRaw) as typeof items;
  } catch {
    return {
      success: false,
      error: locale === "ar" ? "بيانات غير صالحة" : "Invalid payload",
    };
  }

  const inputs = items
    .filter((i) => i.studentId && isAttendanceStatus(i.status))
    .map((i) => ({
      courseId,
      studentId: i.studentId,
      enrollmentId: i.enrollmentId,
      sessionDate,
      sessionNumber: Number.isFinite(sessionNumber) ? sessionNumber : undefined,
      status: i.status as AttendanceStatus,
      notes: i.notes,
    }));

  try {
    const records = await db.bulkUpsertAttendance(
      user.organizationId,
      inputs,
      user.id,
    );
    revalidatePath("/attendance");
    revalidatePath("/students");
    revalidatePath(`/courses/${courseId}`);
    return { success: true, records };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

// ── Student payments ───────────────────────────────────────────────────

export async function createPaymentAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("payments:create");
  const locale = localeOf(user);
  const result = validatePaymentInput(
    paymentInputFromFormData(formData),
    locale,
  );
  if (!result.success) {
    return {
      success: false,
      error: locale === "ar" ? "يرجى تصحيح الحقول" : "Please fix the fields",
      fieldErrors: result.errors,
    };
  }
  try {
    const payment = await db.createStudentPayment(
      user.organizationId,
      result.data,
    );
    revalidatePath("/payments");
    revalidatePath("/students");
    revalidatePath(`/students/${result.data.studentId}`);
    if (result.data.courseId) revalidatePath(`/courses/${result.data.courseId}`);
    return { success: true, payment };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function updatePaymentAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("payments:edit");
  const locale = localeOf(user);
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return {
      success: false,
      error: locale === "ar" ? "معرّف الدفعة مفقود" : "Missing payment id",
    };
  }
  const result = validatePaymentInput(
    paymentInputFromFormData(formData),
    locale,
  );
  if (!result.success) {
    return {
      success: false,
      error: locale === "ar" ? "يرجى تصحيح الحقول" : "Please fix the fields",
      fieldErrors: result.errors,
    };
  }
  const payment = await db.updateStudentPayment(id, result.data);
  if (!payment || payment.organizationId !== user.organizationId) {
    return {
      success: false,
      error: locale === "ar" ? "الدفعة غير موجودة" : "Payment not found",
    };
  }
  revalidatePath("/payments");
  revalidatePath(`/students/${payment.studentId}`);
  return { success: true, payment };
}

export async function deletePaymentAction(id: string): Promise<ActionState> {
  await requirePermission("payments:delete");
  await db.deleteStudentPayment(id);
  revalidatePath("/payments");
  revalidatePath("/students");
  return { success: true };
}
