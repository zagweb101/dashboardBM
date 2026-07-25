"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import type { Student } from "@/types/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";
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

type StudentDetailSheetProps = {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onEdit: (student: Student) => void;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium text-card-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export function StudentDetailSheet({
  student,
  open,
  onOpenChange,
  canEdit,
  onEdit,
}: StudentDetailSheetProps) {
  const { locale, t } = useLanguage();

  if (!student) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("studentDetails")}
      description={student.code}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {t("close")}
          </Button>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(student);
              }}
            >
              {t("edit")}
            </Button>
          ) : null}
          <Link
            href={`/students/${student.id}`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-3 text-xs font-bold transition hover:border-primary/30"
          >
            {t("openProfile")}
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-lg font-extrabold text-primary">
            {getInitials(student.fullName)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold">{student.fullName}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={studentStatusTone[student.status]}>
                {labelStudentStatus(student.status, locale)}
              </Badge>
              <Badge tone="info">
                {labelStudentLevel(student.level, locale)}
              </Badge>
              <Badge>{labelStudentSource(student.source, locale)}</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoChip
            icon={<Phone className="h-4 w-4" />}
            label={t("phone")}
            value={formatPhone(student.phone)}
            dir="ltr"
          />
          <InfoChip
            icon={<Mail className="h-4 w-4" />}
            label={t("email")}
            value={student.email}
            dir="ltr"
          />
          <InfoChip
            icon={<MapPin className="h-4 w-4" />}
            label={t("city")}
            value={student.city}
          />
          <InfoChip
            icon={<CalendarDays className="h-4 w-4" />}
            label={t("joinedAt")}
            value={formatDate(student.joinedAt, locale)}
          />
        </div>

        <dl className="rounded-2xl border border-border bg-muted/30 px-4">
          <DetailRow
            label={t("gender")}
            value={labelStudentGender(student.gender, locale)}
          />
          <DetailRow
            label={t("dateOfBirth")}
            value={formatDate(student.dateOfBirth, locale)}
          />
          <DetailRow label={t("nationalId")} value={student.nationalId} />
          <DetailRow label={t("address")} value={student.address} />
          <DetailRow
            label={t("enrolledCourses")}
            value={student.enrolledCoursesCount}
          />
          <DetailRow
            label={t("totalPaid")}
            value={formatCurrency(student.totalPaid, locale)}
          />
          <DetailRow
            label={t("lastAttendance")}
            value={formatDate(student.lastAttendanceAt, locale)}
          />
          <DetailRow
            label={t("emergencyContactName")}
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
        </dl>

        {student.notes ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              {t("notes")}
            </div>
            <p className="text-sm leading-7 text-card-foreground">
              {student.notes}
            </p>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

function InfoChip({
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
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold" dir={dir}>
        {value || "—"}
      </p>
    </div>
  );
}
