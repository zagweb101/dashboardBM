/**
 * مجال التدريب (دورات / تسجيل / حضور / مدفوعات) — نسخة Mock في الذاكرة.
 * عند وجود DATABASE_URL تُستبدل هذه الدوال بـ pg-repository.ts بنفس الأسماء.
 *
 * الواجهة العامة تبقى عبر: import { db } from "@/lib/db"
 */

import {
  mockAttendance,
  mockCourses,
  mockEnrollments,
  mockStudentPayments,
  mockStudents,
} from "@/lib/db/mock-data";
import type {
  AttendanceFilters,
  AttendanceInput,
  AttendanceRecord,
  AttendanceSessionRosterItem,
  AttendanceStats,
  AttendanceWithDetails,
} from "@/types/attendance";
import type {
  Course,
  CourseFilters,
  CourseInput,
  CourseStats,
  Enrollment,
  EnrollmentInput,
  EnrollmentStatus,
  EnrollmentWithDetails,
} from "@/types/course";
import type {
  PaymentStats,
  StudentPayment,
  StudentPaymentFilters,
  StudentPaymentInput,
  StudentPaymentWithDetails,
} from "@/types/payment";
import { sleep } from "@/lib/utils";

function nextCourseCode(): string {
  const max = mockCourses.reduce((acc, c) => {
    const n = Number(c.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `CRS-${String(max + 1).padStart(4, "0")}`;
}

function recomputeStudentAggregates(studentId: string) {
  const student = mockStudents.find((s) => s.id === studentId);
  if (!student) return;

  const activeEnrollments = mockEnrollments.filter(
    (e) =>
      e.studentId === studentId &&
      (e.status === "active" || e.status === "pending" || e.status === "completed"),
  );
  student.enrolledCoursesCount = activeEnrollments.filter(
    (e) => e.status === "active" || e.status === "completed",
  ).length;

  const paid = mockStudentPayments
    .filter((p) => p.studentId === studentId && p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  student.totalPaid = paid;

  const lastAtt = mockAttendance
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0];
  student.lastAttendanceAt = lastAtt
    ? `${lastAtt.sessionDate}T12:00:00.000Z`
    : student.lastAttendanceAt;
  student.updatedAt = new Date().toISOString();
}

function recomputeEnrollmentPaid(enrollmentId: string) {
  const enr = mockEnrollments.find((e) => e.id === enrollmentId);
  if (!enr) return;
  const paid = mockStudentPayments
    .filter(
      (p) => p.enrollmentId === enrollmentId && p.status === "completed",
    )
    .reduce((sum, p) => sum + p.amount, 0);
  enr.amountPaid = paid;
  enr.updatedAt = new Date().toISOString();
}

function recomputeCourseEnrolled(courseId: string) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) return;
  const count = mockEnrollments.filter(
    (e) =>
      e.courseId === courseId &&
      (e.status === "active" || e.status === "pending"),
  ).length;
  course.enrolledCount = count;
  if (course.status === "open" && count >= course.maxSeats) {
    course.status = "full";
  } else if (course.status === "full" && count < course.maxSeats) {
    course.status = "open";
  }
  course.updatedAt = new Date().toISOString();
}

function matchCourseFilters(course: Course, filters?: CourseFilters): boolean {
  if (!filters) return true;
  if (filters.query) {
    const q = filters.query.trim().toLowerCase();
    const hay = [
      course.title,
      course.code,
      course.instructorName ?? "",
      course.category,
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filters.status && filters.status !== "all" && course.status !== filters.status) {
    return false;
  }
  if (filters.level && filters.level !== "all" && course.level !== filters.level) {
    return false;
  }
  if (
    filters.category &&
    filters.category !== "all" &&
    course.category !== filters.category
  ) {
    return false;
  }
  return true;
}

function enrichEnrollment(e: Enrollment): EnrollmentWithDetails {
  const student = mockStudents.find((s) => s.id === e.studentId);
  const course = mockCourses.find((c) => c.id === e.courseId);
  return {
    ...e,
    studentName: student?.fullName ?? "—",
    studentCode: student?.code ?? "—",
    studentPhone: student?.phone ?? "—",
    courseTitle: course?.title ?? "—",
    courseCode: course?.code ?? "—",
  };
}

function enrichAttendance(a: AttendanceRecord): AttendanceWithDetails {
  const student = mockStudents.find((s) => s.id === a.studentId);
  const course = mockCourses.find((c) => c.id === a.courseId);
  return {
    ...a,
    studentName: student?.fullName ?? "—",
    studentCode: student?.code ?? "—",
    courseTitle: course?.title ?? "—",
  };
}

function enrichPayment(p: StudentPayment): StudentPaymentWithDetails {
  const student = mockStudents.find((s) => s.id === p.studentId);
  const course = p.courseId
    ? mockCourses.find((c) => c.id === p.courseId)
    : null;
  return {
    ...p,
    studentName: student?.fullName ?? "—",
    studentCode: student?.code ?? "—",
    courseTitle: course?.title ?? null,
  };
}

/** مستودع التدريب التجريبي (mock) */
export const mockTrainingDb = {
  // ── Courses ──────────────────────────────────────────────────────────
  async listCourses(
    organizationId: string,
    filters?: CourseFilters,
  ): Promise<Course[]> {
    await sleep(40);
    return mockCourses
      .filter(
        (c) => c.organizationId === organizationId && matchCourseFilters(c, filters),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  },

  async getCourse(id: string): Promise<Course | null> {
    await sleep(20);
    return mockCourses.find((c) => c.id === id) ?? null;
  },

  async getCourseStats(organizationId: string): Promise<CourseStats> {
    await sleep(30);
    const rows = mockCourses.filter((c) => c.organizationId === organizationId);
    return {
      total: rows.length,
      open: rows.filter((c) => c.status === "open").length,
      inProgress: rows.filter((c) => c.status === "in_progress").length,
      completed: rows.filter((c) => c.status === "completed").length,
      totalSeats: rows.reduce((s, c) => s + c.maxSeats, 0),
      filledSeats: rows.reduce((s, c) => s + c.enrolledCount, 0),
    };
  },

  async createCourse(
    organizationId: string,
    input: CourseInput,
  ): Promise<Course> {
    await sleep(70);
    const now = new Date().toISOString();
    const course: Course = {
      id: `crs_${Date.now().toString(36)}`,
      organizationId,
      code: nextCourseCode(),
      title: input.title,
      description: input.description,
      category: input.category,
      level: input.level,
      status: input.status,
      price: input.price,
      durationHours: input.durationHours,
      sessionsCount: input.sessionsCount,
      maxSeats: input.maxSeats,
      instructorName: input.instructorName,
      startDate: input.startDate,
      endDate: input.endDate,
      scheduleNote: input.scheduleNote,
      enrolledCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    mockCourses.unshift(course);
    return course;
  },

  async updateCourse(id: string, input: CourseInput): Promise<Course | null> {
    await sleep(70);
    const index = mockCourses.findIndex((c) => c.id === id);
    if (index < 0) return null;
    const current = mockCourses[index];
    const updated: Course = {
      ...current,
      title: input.title,
      description: input.description,
      category: input.category,
      level: input.level,
      status: input.status,
      price: input.price,
      durationHours: input.durationHours,
      sessionsCount: input.sessionsCount,
      maxSeats: input.maxSeats,
      instructorName: input.instructorName,
      startDate: input.startDate,
      endDate: input.endDate,
      scheduleNote: input.scheduleNote,
      updatedAt: new Date().toISOString(),
    };
    mockCourses[index] = updated;
    recomputeCourseEnrolled(id);
    return mockCourses[index];
  },

  async deleteCourse(id: string): Promise<boolean> {
    await sleep(50);
    const index = mockCourses.findIndex((c) => c.id === id);
    if (index < 0) return false;
    const hasActive = mockEnrollments.some(
      (e) => e.courseId === id && (e.status === "active" || e.status === "pending"),
    );
    if (hasActive) throw new Error("COURSE_HAS_ENROLLMENTS");
    mockCourses.splice(index, 1);
    // Soft cleanup orphans for mock
    for (let i = mockEnrollments.length - 1; i >= 0; i--) {
      if (mockEnrollments[i].courseId === id) mockEnrollments.splice(i, 1);
    }
    for (let i = mockAttendance.length - 1; i >= 0; i--) {
      if (mockAttendance[i].courseId === id) mockAttendance.splice(i, 1);
    }
    return true;
  },

  // ── Enrollments ──────────────────────────────────────────────────────
  async listEnrollments(
    organizationId: string,
    opts?: { courseId?: string; studentId?: string },
  ): Promise<EnrollmentWithDetails[]> {
    await sleep(40);
    return mockEnrollments
      .filter((e) => {
        if (e.organizationId !== organizationId) return false;
        if (opts?.courseId && e.courseId !== opts.courseId) return false;
        if (opts?.studentId && e.studentId !== opts.studentId) return false;
        return true;
      })
      .map(enrichEnrollment)
      .sort(
        (a, b) =>
          new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime(),
      );
  },

  async getEnrollment(id: string): Promise<Enrollment | null> {
    await sleep(15);
    return mockEnrollments.find((e) => e.id === id) ?? null;
  },

  async createEnrollment(
    organizationId: string,
    input: EnrollmentInput,
  ): Promise<Enrollment> {
    await sleep(70);
    const course = mockCourses.find(
      (c) => c.id === input.courseId && c.organizationId === organizationId,
    );
    if (!course) throw new Error("COURSE_NOT_FOUND");

    const student = mockStudents.find(
      (s) => s.id === input.studentId && s.organizationId === organizationId,
    );
    if (!student) throw new Error("STUDENT_NOT_FOUND");

    const dup = mockEnrollments.find(
      (e) =>
        e.courseId === input.courseId &&
        e.studentId === input.studentId &&
        e.status !== "dropped" &&
        e.status !== "refunded",
    );
    if (dup) throw new Error("ALREADY_ENROLLED");

    if (course.enrolledCount >= course.maxSeats && course.status !== "draft") {
      throw new Error("COURSE_FULL");
    }

    const now = new Date().toISOString();
    const status: EnrollmentStatus = input.status ?? "active";
    const enrollment: Enrollment = {
      id: `enr_${Date.now().toString(36)}`,
      organizationId,
      courseId: input.courseId,
      studentId: input.studentId,
      status,
      priceAgreed: input.priceAgreed ?? course.price,
      amountPaid: 0,
      enrolledAt: now,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    mockEnrollments.unshift(enrollment);
    recomputeCourseEnrolled(course.id);
    recomputeStudentAggregates(student.id);
    return enrollment;
  },

  async updateEnrollmentStatus(
    id: string,
    status: EnrollmentStatus,
  ): Promise<Enrollment | null> {
    await sleep(50);
    const enr = mockEnrollments.find((e) => e.id === id);
    if (!enr) return null;
    enr.status = status;
    if (status === "completed") {
      enr.completedAt = new Date().toISOString();
    }
    enr.updatedAt = new Date().toISOString();
    recomputeCourseEnrolled(enr.courseId);
    recomputeStudentAggregates(enr.studentId);
    return enr;
  },

  async deleteEnrollment(id: string): Promise<boolean> {
    await sleep(50);
    const index = mockEnrollments.findIndex((e) => e.id === id);
    if (index < 0) return false;
    const enr = mockEnrollments[index];
    mockEnrollments.splice(index, 1);
    recomputeCourseEnrolled(enr.courseId);
    recomputeStudentAggregates(enr.studentId);
    return true;
  },

  // ── Attendance ───────────────────────────────────────────────────────
  async listAttendance(
    organizationId: string,
    filters?: AttendanceFilters,
  ): Promise<AttendanceWithDetails[]> {
    await sleep(40);
    return mockAttendance
      .filter((a) => {
        if (a.organizationId !== organizationId) return false;
        if (filters?.courseId && filters.courseId !== "all" && a.courseId !== filters.courseId) {
          return false;
        }
        if (
          filters?.studentId &&
          filters.studentId !== "all" &&
          a.studentId !== filters.studentId
        ) {
          return false;
        }
        if (filters?.sessionDate && a.sessionDate !== filters.sessionDate) {
          return false;
        }
        if (filters?.status && filters.status !== "all" && a.status !== filters.status) {
          return false;
        }
        return true;
      })
      .map(enrichAttendance)
      .sort((a, b) => {
        const d = b.sessionDate.localeCompare(a.sessionDate);
        if (d !== 0) return d;
        return a.studentName.localeCompare(b.studentName, "ar");
      });
  },

  async getAttendanceRoster(
    organizationId: string,
    courseId: string,
    sessionDate: string,
  ): Promise<AttendanceSessionRosterItem[]> {
    await sleep(40);
    const enrollments = mockEnrollments.filter(
      (e) =>
        e.organizationId === organizationId &&
        e.courseId === courseId &&
        (e.status === "active" || e.status === "pending"),
    );

    return enrollments
      .map((e) => {
        const student = mockStudents.find((s) => s.id === e.studentId);
        const record =
          mockAttendance.find(
            (a) =>
              a.courseId === courseId &&
              a.studentId === e.studentId &&
              a.sessionDate === sessionDate,
          ) ?? null;
        return {
          studentId: e.studentId,
          studentName: student?.fullName ?? "—",
          studentCode: student?.code ?? "—",
          enrollmentId: e.id,
          record,
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName, "ar"));
  },

  async getAttendanceStats(
    organizationId: string,
    filters?: AttendanceFilters,
  ): Promise<AttendanceStats> {
    const rows = await this.listAttendance(organizationId, filters);
    const present = rows.filter((r) => r.status === "present").length;
    const absent = rows.filter((r) => r.status === "absent").length;
    const late = rows.filter((r) => r.status === "late").length;
    const excused = rows.filter((r) => r.status === "excused").length;
    const totalMarked = rows.length;
    const rate =
      totalMarked > 0 ? (present + late) / totalMarked : 0;
    return { present, absent, late, excused, totalMarked, rate };
  },

  async upsertAttendance(
    organizationId: string,
    input: AttendanceInput,
    recordedBy?: string,
  ): Promise<AttendanceRecord> {
    await sleep(50);
    const existing = mockAttendance.find(
      (a) =>
        a.courseId === input.courseId &&
        a.studentId === input.studentId &&
        a.sessionDate === input.sessionDate,
    );
    const now = new Date().toISOString();

    if (existing) {
      existing.status = input.status;
      existing.notes = input.notes;
      existing.sessionNumber = input.sessionNumber ?? existing.sessionNumber;
      existing.enrollmentId = input.enrollmentId ?? existing.enrollmentId;
      existing.recordedBy = recordedBy ?? existing.recordedBy;
      existing.updatedAt = now;
      recomputeStudentAggregates(input.studentId);
      return existing;
    }

    const record: AttendanceRecord = {
      id: `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      organizationId,
      courseId: input.courseId,
      studentId: input.studentId,
      enrollmentId: input.enrollmentId ?? null,
      sessionDate: input.sessionDate,
      sessionNumber: input.sessionNumber ?? null,
      status: input.status,
      notes: input.notes,
      recordedBy: recordedBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
    mockAttendance.unshift(record);
    recomputeStudentAggregates(input.studentId);
    return record;
  },

  async bulkUpsertAttendance(
    organizationId: string,
    items: AttendanceInput[],
    recordedBy?: string,
  ): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];
    for (const item of items) {
      results.push(await this.upsertAttendance(organizationId, item, recordedBy));
    }
    return results;
  },

  // ── Student payments (tuition) ───────────────────────────────────────
  async listStudentPayments(
    organizationId: string,
    filters?: StudentPaymentFilters,
  ): Promise<StudentPaymentWithDetails[]> {
    await sleep(40);
    return mockStudentPayments
      .filter((p) => {
        if (p.organizationId !== organizationId) return false;
        if (
          filters?.studentId &&
          filters.studentId !== "all" &&
          p.studentId !== filters.studentId
        ) {
          return false;
        }
        if (
          filters?.courseId &&
          filters.courseId !== "all" &&
          p.courseId !== filters.courseId
        ) {
          return false;
        }
        if (filters?.method && filters.method !== "all" && p.method !== filters.method) {
          return false;
        }
        if (filters?.status && filters.status !== "all" && p.status !== filters.status) {
          return false;
        }
        if (filters?.query) {
          const q = filters.query.trim().toLowerCase();
          const student = mockStudents.find((s) => s.id === p.studentId);
          const course = p.courseId
            ? mockCourses.find((c) => c.id === p.courseId)
            : null;
          const hay = [
            student?.fullName ?? "",
            student?.code ?? "",
            p.reference ?? "",
            course?.title ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map(enrichPayment)
      .sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      );
  },

  async getPaymentStats(organizationId: string): Promise<PaymentStats> {
    await sleep(30);
    const rows = mockStudentPayments.filter(
      (p) => p.organizationId === organizationId,
    );
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      totalCollected: rows
        .filter((p) => p.status === "completed")
        .reduce((s, p) => s + p.amount, 0),
      pendingAmount: rows
        .filter((p) => p.status === "pending")
        .reduce((s, p) => s + p.amount, 0),
      refundedAmount: rows
        .filter((p) => p.status === "refunded")
        .reduce((s, p) => s + p.amount, 0),
      paymentsThisMonth: rows.filter(
        (p) =>
          p.status === "completed" && new Date(p.paidAt).getTime() >= monthStart,
      ).length,
      count: rows.length,
    };
  },

  async createStudentPayment(
    organizationId: string,
    input: StudentPaymentInput,
  ): Promise<StudentPayment> {
    await sleep(70);
    const student = mockStudents.find(
      (s) => s.id === input.studentId && s.organizationId === organizationId,
    );
    if (!student) throw new Error("STUDENT_NOT_FOUND");
    if (input.amount <= 0) throw new Error("INVALID_AMOUNT");

    let courseId = input.courseId;
    if (input.enrollmentId) {
      const enr = mockEnrollments.find((e) => e.id === input.enrollmentId);
      if (enr) courseId = courseId ?? enr.courseId;
    }

    const now = new Date().toISOString();
    const payment: StudentPayment = {
      id: `pay_${Date.now().toString(36)}`,
      organizationId,
      studentId: input.studentId,
      enrollmentId: input.enrollmentId ?? null,
      courseId: courseId ?? null,
      amount: input.amount,
      currency: "SAR",
      method: input.method,
      status: input.status ?? "completed",
      paidAt: input.paidAt ?? now,
      reference: input.reference,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    mockStudentPayments.unshift(payment);
    if (payment.enrollmentId) recomputeEnrollmentPaid(payment.enrollmentId);
    recomputeStudentAggregates(payment.studentId);
    return payment;
  },

  async updateStudentPayment(
    id: string,
    input: Partial<StudentPaymentInput> & { status?: StudentPayment["status"] },
  ): Promise<StudentPayment | null> {
    await sleep(60);
    const index = mockStudentPayments.findIndex((p) => p.id === id);
    if (index < 0) return null;
    const current = mockStudentPayments[index];
    const updated: StudentPayment = {
      ...current,
      amount: input.amount ?? current.amount,
      method: input.method ?? current.method,
      status: input.status ?? current.status,
      paidAt: input.paidAt ?? current.paidAt,
      reference: input.reference !== undefined ? input.reference : current.reference,
      notes: input.notes !== undefined ? input.notes : current.notes,
      enrollmentId:
        input.enrollmentId !== undefined
          ? input.enrollmentId
          : current.enrollmentId,
      courseId:
        input.courseId !== undefined ? input.courseId : current.courseId,
      updatedAt: new Date().toISOString(),
    };
    mockStudentPayments[index] = updated;
    if (updated.enrollmentId) recomputeEnrollmentPaid(updated.enrollmentId);
    if (current.enrollmentId && current.enrollmentId !== updated.enrollmentId) {
      recomputeEnrollmentPaid(current.enrollmentId);
    }
    recomputeStudentAggregates(updated.studentId);
    return updated;
  },

  async deleteStudentPayment(id: string): Promise<boolean> {
    await sleep(50);
    const index = mockStudentPayments.findIndex((p) => p.id === id);
    if (index < 0) return false;
    const payment = mockStudentPayments[index];
    mockStudentPayments.splice(index, 1);
    if (payment.enrollmentId) recomputeEnrollmentPaid(payment.enrollmentId);
    recomputeStudentAggregates(payment.studentId);
    return true;
  },
};

/** @deprecated استخدم mockTrainingDb — مُبقى للتوافق */
export const trainingDb = mockTrainingDb;
