"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import type { Course, EnrollmentWithDetails } from "@/types/course";
import type { Student } from "@/types/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FormActions,
  FormAlert,
  FormShell,
} from "@/components/ui/form-layout";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
import {
  enrollStudentAction,
  updateEnrollmentStatusAction,
} from "@/lib/courses/actions";
import {
  courseStatusTone,
  enrollmentStatusTone,
  labelCourseCategory,
  labelCourseLevel,
  labelCourseStatus,
  labelEnrollmentStatus,
} from "@/lib/courses/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ENROLLMENT_STATUSES } from "@/types/course";

type Props = {
  course: Course;
  enrollments: EnrollmentWithDetails[];
  students: Student[];
  canEdit: boolean;
};

export function CourseDetail({
  course,
  enrollments: initialEnrollments,
  students,
  canEdit,
}: Props) {
  const { locale } = useLanguage();
  const { toast } = useToast();
  const ar = locale === "ar";
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [, startStatus] = useTransition();

  const enrolledIds = new Set(
    enrollments
      .filter((e) => e.status !== "dropped" && e.status !== "refunded")
      .map((e) => e.studentId),
  );
  const availableStudents = students.filter((s) => !enrolledIds.has(s.id));

  const onEnroll = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const res = await enrollStudentAction(null, formData);
      if (!res.success || !res.enrollment) {
        setFormError(res.error ?? (ar ? "فشل التسجيل" : "Enroll failed"));
        return;
      }
      const student = students.find((s) => s.id === res.enrollment!.studentId);
      setEnrollments((prev) => {
        if (prev.some((e) => e.id === res.enrollment!.id)) return prev;
        return [
          {
            ...res.enrollment!,
            studentName: student?.fullName ?? "—",
            studentCode: student?.code ?? "—",
            studentPhone: student?.phone ?? "—",
            courseTitle: course.title,
            courseCode: course.code,
          },
          ...prev,
        ];
      });
      setEnrollOpen(false);
      toast({
        title: ar ? "تم تسجيل المتدرب" : "Student enrolled",
        tone: "success",
      });
    });
  };

  const onStatusChange = (id: string, status: string) => {
    startStatus(async () => {
      const res = await updateEnrollmentStatusAction(id, status);
      if (res.success && res.enrollment) {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: res.enrollment!.status } : e,
          ),
        );
        toast({
          title: ar ? "تم تحديث الحالة" : "Status updated",
          tone: "success",
        });
      } else {
        toast({
          title: ar ? "فشل التحديث" : "Update failed",
          description: res.error,
          tone: "error",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/courses"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {ar ? "العودة للدورات" : "Back to courses"}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{course.title}</h2>
            <Badge tone={courseStatusTone[course.status]}>
              {labelCourseStatus(course.status, locale)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.code} · {labelCourseCategory(course.category, locale)} ·{" "}
            {labelCourseLevel(course.level, locale)}
          </p>
        </div>
        {canEdit ? (
          <Button onClick={() => setEnrollOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {ar ? "تسجيل متدرب" : "Enroll student"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {ar ? "السعر" : "Price"}
            </p>
            <p className="mt-1 text-xl font-extrabold">
              {formatCurrency(course.price, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {ar ? "المقاعد" : "Seats"}
            </p>
            <p className="mt-1 text-xl font-extrabold">
              {course.enrolledCount}/{course.maxSeats}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {ar ? "الجلسات" : "Sessions"}
            </p>
            <p className="mt-1 text-xl font-extrabold">
              {course.sessionsCount} · {course.durationHours}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {ar ? "المدرب" : "Instructor"}
            </p>
            <p className="mt-1 text-base font-bold">
              {course.instructorName || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={ar ? "تفاصيل الدورة" : "Course details"}
          description={course.scheduleNote || undefined}
        />
        <CardContent className="space-y-3 text-sm">
          {course.description ? (
            <p className="leading-7 text-muted-foreground">{course.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <span>
              {ar ? "البداية:" : "Start:"}{" "}
              <strong className="text-foreground">
                {formatDate(course.startDate, locale)}
              </strong>
            </span>
            <span>
              {ar ? "النهاية:" : "End:"}{" "}
              <strong className="text-foreground">
                {formatDate(course.endDate, locale)}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={ar ? "المتدربون المسجّلون" : "Enrolled students"}
          description={`${enrollments.length} ${ar ? "تسجيل" : "enrollments"}`}
        />
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "المتدرب" : "Student"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "المبلغ" : "Fee"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "المدفوع" : "Paid"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "تاريخ التسجيل" : "Enrolled"}
                </th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {ar ? "لا يوجد مسجّلون بعد" : "No enrollments yet"}
                  </td>
                </tr>
              ) : (
                enrollments.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/students/${e.studentId}`}
                        className="font-semibold hover:text-primary"
                      >
                        {e.studentName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {e.studentCode} · {e.studentPhone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <select
                          className="h-9 rounded-lg border border-border bg-background px-2 text-xs font-semibold"
                          value={e.status}
                          onChange={(ev) =>
                            onStatusChange(e.id, ev.target.value)
                          }
                        >
                          {ENROLLMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {labelEnrollmentStatus(s, locale)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge tone={enrollmentStatusTone[e.status]}>
                          {labelEnrollmentStatus(e.status, locale)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatCurrency(e.priceAgreed, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(e.amountPaid, locale)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(e.enrolledAt, locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        title={ar ? "تسجيل متدرب في الدورة" : "Enroll student"}
        description={course.title}
        size="md"
      >
        <FormShell
          action={onEnroll}
          actions={
            <FormActions>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setEnrollOpen(false)}
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto sm:min-w-[8rem]"
                disabled={pending || availableStudents.length === 0}
              >
                {pending
                  ? ar
                    ? "جارٍ التسجيل..."
                    : "Enrolling..."
                  : ar
                    ? "تأكيد التسجيل"
                    : "Confirm enrollment"}
              </Button>
            </FormActions>
          }
        >
          <input type="hidden" name="courseId" value={course.id} />
          {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}
          <div className="space-y-4">
            <Select
              name="studentId"
              label={ar ? "المتدرب" : "Student"}
              required
              options={[
                {
                  value: "",
                  label: ar ? "اختر متدرباً" : "Select student",
                  disabled: true,
                },
                ...availableStudents.map((s) => ({
                  value: s.id,
                  label: `${s.fullName} (${s.code})`,
                })),
              ]}
              defaultValue=""
            />
            <Input
              name="priceAgreed"
              type="number"
              min={0}
              label={
                ar ? "المبلغ المتفق (اختياري)" : "Agreed fee (optional)"
              }
              placeholder={String(course.price)}
              inputMode="decimal"
            />
            <Input
              name="notes"
              label={ar ? "ملاحظات" : "Notes"}
              placeholder={ar ? "اختياري" : "Optional"}
            />
          </div>
        </FormShell>
      </Dialog>
    </div>
  );
}
