"use client";

import { useActionState, useEffect, useMemo } from "react";
import {
  STUDENT_GENDERS,
  STUDENT_LEVELS,
  STUDENT_SOURCES,
  STUDENT_STATUSES,
  type Student,
} from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/providers/language-provider";
import {
  labelStudentGender,
  labelStudentLevel,
  labelStudentSource,
  labelStudentStatus,
} from "@/lib/students/labels";
import {
  createStudentAction,
  updateStudentAction,
  type StudentActionState,
} from "@/lib/students/actions";

type StudentFormProps = {
  mode: "create" | "edit";
  student?: Student;
  onSuccess?: (student: Student) => void;
  onCancel?: () => void;
};

const initialState: StudentActionState = { success: false };

export function StudentForm({
  mode,
  student,
  onSuccess,
  onCancel,
}: StudentFormProps) {
  const { locale, t } = useLanguage();
  const action = mode === "create" ? createStudentAction : updateStudentAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && state.student) {
      onSuccess?.(state.student);
    }
  }, [state, onSuccess]);

  const statusOptions = useMemo(
    () =>
      STUDENT_STATUSES.map((value) => ({
        value,
        label: labelStudentStatus(value, locale),
      })),
    [locale],
  );

  const levelOptions = useMemo(
    () =>
      STUDENT_LEVELS.map((value) => ({
        value,
        label: labelStudentLevel(value, locale),
      })),
    [locale],
  );

  const sourceOptions = useMemo(
    () =>
      STUDENT_SOURCES.map((value) => ({
        value,
        label: labelStudentSource(value, locale),
      })),
    [locale],
  );

  const genderOptions = useMemo(
    () =>
      STUDENT_GENDERS.map((value) => ({
        value,
        label: labelStudentGender(value, locale),
      })),
    [locale],
  );

  const fieldError = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="space-y-5">
      {mode === "edit" && student ? (
        <input type="hidden" name="id" value={student.id} />
      ) : null}

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {state.error === "EMAIL_EXISTS"
            ? t("studentEmailExists")
            : state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="fullName"
          label={t("fullName")}
          required
          defaultValue={student?.fullName}
          error={fieldError("fullName")}
          placeholder={locale === "ar" ? "الاسم الثلاثي" : "Full name"}
        />
        <Input
          name="email"
          type="email"
          label={t("email")}
          required
          defaultValue={student?.email}
          error={fieldError("email")}
          placeholder="name@example.com"
          dir="ltr"
          className="text-start"
        />
        <Input
          name="phone"
          label={t("phone")}
          required
          defaultValue={student?.phone}
          error={fieldError("phone")}
          placeholder="05xxxxxxxx"
          dir="ltr"
          className="text-start"
        />
        <Input
          name="nationalId"
          label={t("nationalId")}
          defaultValue={student?.nationalId}
          error={fieldError("nationalId")}
          placeholder="1xxxxxxxxx"
          dir="ltr"
          className="text-start"
        />
        <Select
          name="gender"
          label={t("gender")}
          required
          defaultValue={student?.gender ?? "male"}
          options={genderOptions}
          error={fieldError("gender")}
        />
        <Input
          name="dateOfBirth"
          type="date"
          label={t("dateOfBirth")}
          defaultValue={student?.dateOfBirth}
          error={fieldError("dateOfBirth")}
        />
        <Input
          name="city"
          label={t("city")}
          required
          defaultValue={student?.city}
          error={fieldError("city")}
          placeholder={locale === "ar" ? "جدة" : "Jeddah"}
        />
        <Input
          name="address"
          label={t("address")}
          defaultValue={student?.address}
          error={fieldError("address")}
        />
        <Select
          name="status"
          label={t("status")}
          defaultValue={student?.status ?? "active"}
          options={statusOptions}
          error={fieldError("status")}
        />
        <Select
          name="level"
          label={t("level")}
          defaultValue={student?.level ?? "beginner"}
          options={levelOptions}
          error={fieldError("level")}
        />
        <Select
          name="source"
          label={t("source")}
          defaultValue={student?.source ?? "walk_in"}
          options={sourceOptions}
          error={fieldError("source")}
        />
        <Input
          name="emergencyContactName"
          label={t("emergencyContactName")}
          defaultValue={student?.emergencyContactName}
          error={fieldError("emergencyContactName")}
        />
        <Input
          name="emergencyContactPhone"
          label={t("emergencyContactPhone")}
          defaultValue={student?.emergencyContactPhone}
          error={fieldError("emergencyContactPhone")}
          placeholder="05xxxxxxxx"
          dir="ltr"
          className="text-start"
        />
      </div>

      <Textarea
        name="notes"
        label={t("notes")}
        defaultValue={student?.notes}
        error={fieldError("notes")}
        rows={3}
        placeholder={
          locale === "ar"
            ? "ملاحظات داخلية عن المتدرب..."
            : "Internal notes about the student..."
        }
      />

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? t("saving")
            : mode === "create"
              ? t("addStudent")
              : t("save")}
        </Button>
      </div>
    </form>
  );
}
