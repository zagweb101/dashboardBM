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
import {
  FormActions,
  FormAlert,
  FormFull,
  FormGrid,
  FormSection,
  FormShell,
} from "@/components/ui/form-layout";
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
  const ar = locale === "ar";

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
    <FormShell
      action={formAction}
      actions={
        <FormActions>
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onCancel}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
          ) : null}
          <Button
            type="submit"
            className="w-full sm:w-auto sm:min-w-[8.5rem]"
            disabled={pending}
          >
            {pending
              ? t("saving")
              : mode === "create"
                ? t("addStudent")
                : t("save")}
          </Button>
        </FormActions>
      }
    >
      {mode === "edit" && student ? (
        <input type="hidden" name="id" value={student.id} />
      ) : null}

      {state.error ? (
        <FormAlert tone="error">
          {state.error === "EMAIL_EXISTS"
            ? t("studentEmailExists")
            : state.error}
        </FormAlert>
      ) : null}

      <FormSection
        title={ar ? "البيانات الأساسية" : "Basic info"}
        description={
          ar
            ? "الاسم ووسائل التواصل تظهر في القوائم والتقارير"
            : "Name and contact details used across the app"
        }
      >
        <FormGrid>
          <Input
            name="fullName"
            label={t("fullName")}
            required
            defaultValue={student?.fullName}
            error={fieldError("fullName")}
            placeholder={ar ? "الاسم الثلاثي" : "Full name"}
            autoComplete="name"
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
            autoComplete="email"
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
            inputMode="tel"
            autoComplete="tel"
          />
          <Input
            name="nationalId"
            label={t("nationalId")}
            defaultValue={student?.nationalId}
            error={fieldError("nationalId")}
            placeholder="1xxxxxxxxx"
            dir="ltr"
            className="text-start"
            inputMode="numeric"
          />
        </FormGrid>
      </FormSection>

      <FormSection title={ar ? "التفاصيل" : "Details"}>
        <FormGrid>
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
            placeholder={ar ? "جدة" : "Jeddah"}
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
            inputMode="tel"
          />
        </FormGrid>
      </FormSection>

      <FormSection title={t("notes")}>
        <FormFull>
          <Textarea
            name="notes"
            defaultValue={student?.notes}
            error={fieldError("notes")}
            rows={3}
            placeholder={
              ar
                ? "ملاحظات داخلية عن المتدرب..."
                : "Internal notes about the student..."
            }
          />
        </FormFull>
      </FormSection>
    </FormShell>
  );
}
