import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  labelStudentGender,
  labelStudentLevel,
  labelStudentSource,
  labelStudentStatus,
  studentStatusTone,
} from "@/lib/students/labels";
import {
  formatCurrency,
  formatDate,
  formatPhone,
  getInitials,
} from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const student = await db.getStudent(id);
  return {
    title: student
      ? `${student.fullName} | بيت المصور`
      : "متدرب | بيت المصور",
  };
}

export default async function StudentDetailPage({ params }: PageProps) {
  const user = await requirePermission("students:view");
  const { id } = await params;
  const student = await db.getStudent(id);

  if (!student || student.organizationId !== user.organizationId) {
    notFound();
  }

  const locale = user.locale === "en" ? "en" : "ar";

  const [enrollments, payments, attendance] = await Promise.all([
    db.listEnrollments(user.organizationId, { studentId: student.id }),
    db.listStudentPayments(user.organizationId, { studentId: student.id }),
    db.listAttendance(user.organizationId, { studentId: student.id }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/students"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {locale === "ar" ? "العودة للمتدربين" : "Back to students"}
          </Link>
          <h2 className="text-lg font-bold">
            {locale === "ar" ? "ملف المتدرب" : "Student profile"}
          </h2>
        </div>
        <Badge tone={studentStatusTone[student.status]}>
          {labelStudentStatus(student.status, locale)}
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-extrabold text-primary">
            {getInitials(student.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground" dir="ltr">
              {student.code}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold">{student.fullName}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="info">
                {labelStudentLevel(student.level, locale)}
              </Badge>
              <Badge>{labelStudentSource(student.source, locale)}</Badge>
              <Badge tone="default">
                {labelStudentGender(student.gender, locale)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<BookOpen className="h-4 w-4" />}
          label={locale === "ar" ? "الدورات المسجّلة" : "Enrolled courses"}
          value={String(student.enrolledCoursesCount)}
        />
        <Metric
          icon={<Wallet className="h-4 w-4" />}
          label={locale === "ar" ? "إجمالي المدفوع" : "Total paid"}
          value={formatCurrency(student.totalPaid, locale)}
        />
        <Metric
          icon={<CalendarDays className="h-4 w-4" />}
          label={locale === "ar" ? "تاريخ الانضمام" : "Joined"}
          value={formatDate(student.joinedAt, locale)}
        />
        <Metric
          icon={<CalendarDays className="h-4 w-4" />}
          label={locale === "ar" ? "آخر حضور" : "Last attendance"}
          value={formatDate(student.lastAttendanceAt, locale)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={locale === "ar" ? "معلومات التواصل" : "Contact"}
          />
          <CardContent className="space-y-3">
            <InfoLine
              icon={<Phone className="h-4 w-4" />}
              label={locale === "ar" ? "الجوال" : "Phone"}
              value={formatPhone(student.phone)}
              dir="ltr"
            />
            <InfoLine
              icon={<Mail className="h-4 w-4" />}
              label={locale === "ar" ? "البريد" : "Email"}
              value={student.email}
              dir="ltr"
            />
            <InfoLine
              icon={<MapPin className="h-4 w-4" />}
              label={locale === "ar" ? "المدينة" : "City"}
              value={student.city}
            />
            <InfoLine
              icon={<MapPin className="h-4 w-4" />}
              label={locale === "ar" ? "العنوان" : "Address"}
              value={student.address ?? "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={locale === "ar" ? "بيانات إضافية" : "Additional details"}
          />
          <CardContent className="space-y-3 text-sm">
            <Row
              label={locale === "ar" ? "رقم الهوية" : "National ID"}
              value={student.nationalId ?? "—"}
            />
            <Row
              label={locale === "ar" ? "تاريخ الميلاد" : "Date of birth"}
              value={formatDate(student.dateOfBirth, locale)}
            />
            <Row
              label={locale === "ar" ? "جهة الطوارئ" : "Emergency contact"}
              value={
                student.emergencyContactName
                  ? `${student.emergencyContactName}${
                      student.emergencyContactPhone
                        ? ` · ${formatPhone(student.emergencyContactPhone)}`
                        : ""
                    }`
                  : "—"
              }
            />
            <Row
              label={locale === "ar" ? "آخر تحديث" : "Last updated"}
              value={formatDate(student.updatedAt, locale)}
            />
          </CardContent>
        </Card>
      </section>

      {student.notes ? (
        <Card>
          <CardHeader title={locale === "ar" ? "ملاحظات" : "Notes"} />
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              {student.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={locale === "ar" ? "الدورات المسجّلة" : "Enrollments"}
            description={
              locale === "ar"
                ? `${enrollments.length} تسجيل`
                : `${enrollments.length} enrollments`
            }
            action={
              <Link
                href="/courses"
                className="text-xs font-bold text-primary hover:underline"
              >
                {locale === "ar" ? "كل الدورات" : "All courses"}
              </Link>
            }
          />
          <CardContent className="space-y-2">
            {enrollments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {locale === "ar" ? "لا تسجيلات بعد" : "No enrollments yet"}
              </p>
            ) : (
              enrollments.map((e) => (
                <Link
                  key={e.id}
                  href={`/courses/${e.courseId}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 transition hover:border-primary/30"
                >
                  <div>
                    <p className="text-sm font-bold">{e.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.courseCode} · {formatDate(e.enrolledAt, locale)}
                    </p>
                  </div>
                  <div className="text-end text-xs">
                    <p className="font-semibold">
                      {formatCurrency(e.amountPaid, locale)} /{" "}
                      {formatCurrency(e.priceAgreed, locale)}
                    </p>
                    <p className="text-muted-foreground">{e.status}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={locale === "ar" ? "المدفوعات" : "Payments"}
            description={
              locale === "ar"
                ? `${payments.length} دفعة`
                : `${payments.length} payments`
            }
            action={
              <Link
                href="/payments"
                className="text-xs font-bold text-primary hover:underline"
              >
                {locale === "ar" ? "السجل الكامل" : "Full ledger"}
              </Link>
            }
          />
          <CardContent className="space-y-2">
            {payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {locale === "ar" ? "لا مدفوعات بعد" : "No payments yet"}
              </p>
            ) : (
              payments.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-bold">
                      {formatCurrency(p.amount, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.courseTitle || "—"} · {formatDate(p.paidAt, locale)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      p.status === "completed"
                        ? "success"
                        : p.status === "pending"
                          ? "warning"
                          : "default"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader
          title={locale === "ar" ? "آخر الحضور" : "Recent attendance"}
          action={
            <Link
              href="/attendance"
              className="text-xs font-bold text-primary hover:underline"
            >
              {locale === "ar" ? "تسجيل حضور" : "Mark attendance"}
            </Link>
          }
        />
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="px-4 py-3 text-start font-semibold">
                  {locale === "ar" ? "التاريخ" : "Date"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {locale === "ar" ? "الدورة" : "Course"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {locale === "ar" ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {locale === "ar" ? "لا سجلات حضور" : "No attendance yet"}
                  </td>
                </tr>
              ) : (
                attendance.slice(0, 10).map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{a.sessionDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.courseTitle}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          a.status === "present"
                            ? "success"
                            : a.status === "absent"
                              ? "danger"
                              : a.status === "late"
                                ? "warning"
                                : "info"
                        }
                      >
                        {a.status}
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

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  dir,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-semibold" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
