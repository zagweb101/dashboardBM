"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  studentInputFromFormData,
  validateStudentInput,
} from "@/lib/students/validation";
import type { Student } from "@/types/student";

export type StudentActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  student?: Student;
};

export async function createStudentAction(
  _prev: StudentActionState | null,
  formData: FormData,
): Promise<StudentActionState> {
  const user = await requirePermission("students:create");
  const locale = user.locale === "en" ? "en" : "ar";
  const raw = studentInputFromFormData(formData);
  const result = validateStudentInput(raw, locale);

  if (!result.success) {
    return {
      success: false,
      error: locale === "ar" ? "يرجى تصحيح الحقول المحددة" : "Please fix the highlighted fields",
      fieldErrors: result.errors as Record<string, string>,
    };
  }

  try {
    const student = await db.createStudent(user.organizationId, result.data);
    revalidatePath("/students");
    return { success: true, student };
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_EXISTS") {
      return {
        success: false,
        error: "EMAIL_EXISTS",
        fieldErrors: {
          email:
            locale === "ar"
              ? "البريد مستخدم مسبقاً"
              : "Email already in use",
        },
      };
    }
    const message =
      err instanceof Error
        ? err.message
        : locale === "ar"
          ? "تعذّر إضافة المتدرب"
          : "Could not create student";
    return { success: false, error: message };
  }
}

export async function updateStudentAction(
  _prev: StudentActionState | null,
  formData: FormData,
): Promise<StudentActionState> {
  const user = await requirePermission("students:edit");
  const locale = user.locale === "en" ? "en" : "ar";
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return {
      success: false,
      error: locale === "ar" ? "معرّف المتدرب مفقود" : "Missing student id",
    };
  }

  const existing = await db.getStudent(id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return {
      success: false,
      error: locale === "ar" ? "المتدرب غير موجود" : "Student not found",
    };
  }

  const raw = studentInputFromFormData(formData);
  const result = validateStudentInput(raw, locale);

  if (!result.success) {
    return {
      success: false,
      error: locale === "ar" ? "يرجى تصحيح الحقول المحددة" : "Please fix the highlighted fields",
      fieldErrors: result.errors as Record<string, string>,
    };
  }

  try {
    const student = await db.updateStudent(id, result.data);
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    return { success: true, student: student ?? undefined };
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_EXISTS") {
      return {
        success: false,
        error: "EMAIL_EXISTS",
        fieldErrors: {
          email:
            locale === "ar"
              ? "البريد مستخدم مسبقاً"
              : "Email already in use",
        },
      };
    }
    const message =
      err instanceof Error
        ? err.message
        : locale === "ar"
          ? "تعذّر تحديث المتدرب"
          : "Could not update student";
    return { success: false, error: message };
  }
}

export async function deleteStudentAction(id: string): Promise<StudentActionState> {
  const user = await requirePermission("students:delete");
  const locale = user.locale === "en" ? "en" : "ar";

  const existing = await db.getStudent(id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return {
      success: false,
      error: locale === "ar" ? "المتدرب غير موجود" : "Student not found",
    };
  }

  const ok = await db.deleteStudent(id);
  if (!ok) {
    return {
      success: false,
      error: locale === "ar" ? "تعذّر حذف المتدرب" : "Could not delete student",
    };
  }

  revalidatePath("/students");
  return { success: true };
}
