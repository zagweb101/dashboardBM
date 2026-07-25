"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarCheck,
  Check,
  Clock,
  Save,
  UserX,
  Shield,
} from "lucide-react";
import type { Course } from "@/types/course";
import type {
  AttendanceSessionRosterItem,
  AttendanceStats,
  AttendanceStatus,
  AttendanceWithDetails,
} from "@/types/attendance";
import { ATTENDANCE_STATUSES } from "@/types/attendance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/dashboard/StatCard";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
import { saveAttendanceSessionAction } from "@/lib/courses/actions";
import {
  attendanceStatusTone,
  labelAttendanceStatus,
} from "@/lib/courses/labels";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import {
  EmptyIcon,
  EmptyState,
  getEmptyCopy,
} from "@/components/ui/empty-state";
import Link from "next/link";

type Props = {
  courses: Course[];
  recent: AttendanceWithDetails[];
  stats: AttendanceStats;
  initialRoster: AttendanceSessionRosterItem[];
  initialCourseId: string;
  initialSessionDate: string;
  canManage: boolean;
};

type RowState = {
  studentId: string;
  enrollmentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
  notes?: string;
};

export function AttendanceModule({
  courses,
  recent,
  stats,
  initialRoster,
  initialCourseId,
  initialSessionDate,
  canManage,
}: Props) {
  const { locale } = useLanguage();
  const { toast } = useToast();
  const ar = locale === "ar";
  const [pending, startTransition] = useTransition();

  const [courseId, setCourseId] = useState(initialCourseId);
  const [sessionDate, setSessionDate] = useState(initialSessionDate);
  const [sessionNumber, setSessionNumber] = useState("");
  const [rows, setRows] = useState<RowState[]>(() =>
    initialRoster.map((r) => ({
      studentId: r.studentId,
      enrollmentId: r.enrollmentId,
      studentName: r.studentName,
      studentCode: r.studentCode,
      status: r.record?.status ?? "present",
      notes: r.record?.notes,
    })),
  );
  const [history, setHistory] = useState(recent);

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((r) => ({
          studentId: r.studentId,
          enrollmentId: r.enrollmentId,
          status: r.status,
          notes: r.notes,
        })),
      ),
    [rows],
  );

  const setAll = (status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
    );
  };

  const reloadRoster = (nextCourseId: string, nextDate: string) => {
    const params = new URLSearchParams({
      courseId: nextCourseId,
      date: nextDate,
    });
    window.location.href = `/attendance?${params.toString()}`;
  };

  const onSave = () => {
    const formData = new FormData();
    formData.set("courseId", courseId);
    formData.set("sessionDate", sessionDate);
    formData.set("sessionNumber", sessionNumber);
    formData.set("payload", payload);

    startTransition(async () => {
      const res = await saveAttendanceSessionAction(null, formData);
      if (!res.success) {
        toast({
          title: ar ? "فشل الحفظ" : "Save failed",
          description: res.error,
          tone: "error",
        });
        return;
      }

      const course = courses.find((c) => c.id === courseId);
      const updated = rows.map((r) => ({
        id: `local_${r.studentId}_${sessionDate}`,
        organizationId: "",
        courseId,
        studentId: r.studentId,
        sessionDate,
        status: r.status,
        notes: r.notes,
        studentName: r.studentName,
        studentCode: r.studentCode,
        courseTitle: course?.title ?? "—",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setHistory((prev) => {
        const without = prev.filter(
          (p) => !(p.courseId === courseId && p.sessionDate === sessionDate),
        );
        return [...updated, ...without].slice(0, 40);
      });
      toast({
        title: ar ? "تم حفظ الحضور" : "Attendance saved",
        tone: "success",
      });
    });
  };

  const statusBtn = (
    status: AttendanceStatus,
    active: boolean,
    onClick: () => void,
  ) => {
    const icons = {
      present: Check,
      absent: UserX,
      late: Clock,
      excused: Shield,
    };
    const Icon = icons[status];
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!canManage}
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-bold transition",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:border-primary/40",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {labelAttendanceStatus(status, locale)}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "الحضور" : "Attendance"}
        description={
          ar
            ? "تسجيل حضور جلسة الدورة وتتبّع النسب."
            : "Mark session attendance and track rates."
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={ar ? "حاضر" : "Present"}
          value={formatNumber(stats.present, locale)}
          change={ar ? "في السجلات الحالية" : "In current filter"}
          trend="up"
          icon={<Check className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <StatCard
          title={ar ? "غائب" : "Absent"}
          value={formatNumber(stats.absent, locale)}
          change={`${formatNumber(stats.late, locale)} ${ar ? "متأخر" : "late"}`}
          trend="down"
          icon={<UserX className="h-5 w-5" />}
          accent="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
        />
        <StatCard
          title={ar ? "بعذر" : "Excused"}
          value={formatNumber(stats.excused, locale)}
          change={ar ? "معذور" : "Excused absences"}
          trend="neutral"
          icon={<Shield className="h-5 w-5" />}
          accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
        />
        <StatCard
          title={ar ? "نسبة الحضور" : "Attendance rate"}
          value={formatPercent(stats.rate, locale)}
          change={`${formatNumber(stats.totalMarked, locale)} ${ar ? "سجل" : "records"}`}
          trend="neutral"
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="bg-primary/10 text-primary"
        />
      </section>

      <Card>
        <CardHeader
          title={ar ? "تسجيل جلسة" : "Mark session"}
          description={
            ar
              ? "اختر الدورة والتاريخ، ثم حدّد حالة كل متدرب."
              : "Pick course and date, then set each trainee status."
          }
          action={
            canManage ? (
              <div className="flex flex-wrap gap-1">
                {ATTENDANCE_STATUSES.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setAll(s)}
                  >
                    {labelAttendanceStatus(s, locale)}
                  </Button>
                ))}
              </div>
            ) : null
          }
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              name="courseSelect"
              label={ar ? "الدورة" : "Course"}
              options={courses.map((c) => ({
                value: c.id,
                label: `${c.code} — ${c.title}`,
              }))}
              value={courseId}
              onChange={(e) => {
                const id = e.target.value;
                setCourseId(id);
                reloadRoster(id, sessionDate);
              }}
            />
            <Input
              name="sessionDateUi"
              type="date"
              label={ar ? "تاريخ الجلسة" : "Session date"}
              value={sessionDate}
              onChange={(e) => {
                const d = e.target.value;
                setSessionDate(d);
                reloadRoster(courseId, d);
              }}
            />
            <Input
              name="sessionNumberUi"
              type="number"
              min={1}
              label={ar ? "رقم الجلسة (اختياري)" : "Session # (optional)"}
              value={sessionNumber}
              onChange={(e) => setSessionNumber(e.target.value)}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              compact
              icon={
                <EmptyIcon
                  icon={getEmptyCopy("attendance", ar ? "ar" : "en").Icon}
                />
              }
              title={getEmptyCopy("attendance", ar ? "ar" : "en").title}
              description={
                getEmptyCopy("attendance", ar ? "ar" : "en").description
              }
              action={
                <Link
                  href="/courses"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-110"
                >
                  {getEmptyCopy("attendance", ar ? "ar" : "en").action}
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-3 text-start font-semibold">
                      {ar ? "المتدرب" : "Student"}
                    </th>
                    <th className="px-4 py-3 text-start font-semibold">
                      {ar ? "الحالة" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.studentId} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{row.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.studentCode}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {ATTENDANCE_STATUSES.map((s) =>
                            statusBtn(s, row.status === s, () =>
                              setStatus(row.studentId, s),
                            ),
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {canManage && rows.length > 0 ? (
            <div className="flex justify-end">
              <Button type="button" disabled={pending} onClick={onSave}>
                <Save className="h-4 w-4" />
                {pending
                  ? ar
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : ar
                    ? "حفظ الحضور"
                    : "Save attendance"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={ar ? "آخر السجلات" : "Recent records"}
          description={ar ? "أحدث حالات الحضور" : "Latest attendance marks"}
        />
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "التاريخ" : "Date"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "المتدرب" : "Student"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "الدورة" : "Course"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {ar ? "لا سجلات بعد" : "No records yet"}
                  </td>
                </tr>
              ) : (
                history.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.sessionDate}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.studentCode}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.courseTitle}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={attendanceStatusTone[r.status]}>
                        {labelAttendanceStatus(r.status, locale)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
