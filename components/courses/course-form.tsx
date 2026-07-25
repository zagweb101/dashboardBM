"use client";

import { useActionState, useEffect, useMemo } from "react";
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  COURSE_STATUSES,
  type Course,
} from "@/types/course";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FormAlert,
  FormFull,
  FormGrid,
  FormSection,
  FormShell,
} from "@/components/ui/form-layout";
import { useLanguage } from "@/components/providers/language-provider";
import {
  labelCourseCategory,
  labelCourseLevel,
  labelCourseStatus,
} from "@/lib/courses/labels";
import {
  createCourseAction,
  updateCourseAction,
  type ActionState,
} from "@/lib/courses/actions";

type CourseFormProps = {
  formId: string;
  mode: "create" | "edit";
  course?: Course;
  onSuccess?: (course: Course) => void;
  onPendingChange?: (pending: boolean) => void;
};

const initialState: ActionState = { success: false };

export function CourseForm({
  formId,
  mode,
  course,
  onSuccess,
  onPendingChange,
}: CourseFormProps) {
  const { locale } = useLanguage();
  const action = mode === "create" ? createCourseAction : updateCourseAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const ar = locale === "ar";

  useEffect(() => {
    if (state.success && state.course) onSuccess?.(state.course);
  }, [state, onSuccess]);

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  const statusOptions = useMemo(
    () =>
      COURSE_STATUSES.map((value) => ({
        value,
        label: labelCourseStatus(value, locale),
      })),
    [locale],
  );
  const levelOptions = useMemo(
    () =>
      COURSE_LEVELS.map((value) => ({
        value,
        label: labelCourseLevel(value, locale),
      })),
    [locale],
  );
  const categoryOptions = useMemo(
    () =>
      COURSE_CATEGORIES.map((value) => ({
        value,
        label: labelCourseCategory(value, locale),
      })),
    [locale],
  );

  const fe = (key: string) => state.fieldErrors?.[key];

  return (
    <FormShell id={formId} action={formAction}>
      {mode === "edit" && course ? (
        <input type="hidden" name="id" value={course.id} />
      ) : null}

      {state.error ? <FormAlert tone="error">{state.error}</FormAlert> : null}

      <FormSection
        title={ar ? "معلومات الدورة" : "Course info"}
        description={
          ar
            ? "العنوان والتصنيف يظهران في كتالوج الدورات"
            : "Title and category shown in the course catalog"
        }
      >
        <FormGrid>
          <FormFull>
            <Input
              name="title"
              label={ar ? "عنوان الدورة" : "Course title"}
              defaultValue={course?.title}
              error={fe("title")}
              required
              placeholder={
                ar ? "مثال: أساسيات التصوير" : "e.g. Photography basics"
              }
            />
          </FormFull>
          <Select
            name="category"
            label={ar ? "التصنيف" : "Category"}
            options={categoryOptions}
            defaultValue={course?.category ?? "basics"}
            error={fe("category")}
          />
          <Select
            name="level"
            label={ar ? "المستوى" : "Level"}
            options={levelOptions}
            defaultValue={course?.level ?? "beginner"}
            error={fe("level")}
          />
          <Select
            name="status"
            label={ar ? "الحالة" : "Status"}
            options={statusOptions}
            defaultValue={course?.status ?? "draft"}
            error={fe("status")}
          />
          <Input
            name="instructorName"
            label={ar ? "المدرب" : "Instructor"}
            defaultValue={course?.instructorName}
            placeholder={ar ? "اسم المدرب" : "Instructor name"}
          />
        </FormGrid>
      </FormSection>

      <FormSection title={ar ? "السعر والمقاعد" : "Pricing & seats"}>
        <FormGrid>
          <Input
            name="price"
            type="number"
            min={0}
            step={50}
            label={ar ? "السعر (ر.س)" : "Price (SAR)"}
            defaultValue={course?.price ?? 1500}
            error={fe("price")}
            required
            inputMode="decimal"
          />
          <Input
            name="maxSeats"
            type="number"
            min={1}
            label={ar ? "المقاعد" : "Seats"}
            defaultValue={course?.maxSeats ?? 12}
            error={fe("maxSeats")}
            required
            inputMode="numeric"
          />
          <Input
            name="durationHours"
            type="number"
            min={1}
            label={ar ? "الساعات" : "Hours"}
            defaultValue={course?.durationHours ?? 18}
            error={fe("durationHours")}
            required
            inputMode="numeric"
          />
          <Input
            name="sessionsCount"
            type="number"
            min={1}
            label={ar ? "عدد الجلسات" : "Sessions"}
            defaultValue={course?.sessionsCount ?? 6}
            error={fe("sessionsCount")}
            required
            inputMode="numeric"
          />
          <Input
            name="startDate"
            type="date"
            label={ar ? "تاريخ البداية" : "Start date"}
            defaultValue={course?.startDate}
          />
          <Input
            name="endDate"
            type="date"
            label={ar ? "تاريخ النهاية" : "End date"}
            defaultValue={course?.endDate}
          />
          <FormFull>
            <Input
              name="scheduleNote"
              label={ar ? "جدول المواعيد" : "Schedule note"}
              defaultValue={course?.scheduleNote}
              placeholder={ar ? "أحد وثلاثاء · 6م" : "Sun & Tue · 6pm"}
            />
          </FormFull>
          <FormFull>
            <Textarea
              name="description"
              label={ar ? "الوصف" : "Description"}
              defaultValue={course?.description}
              rows={3}
            />
          </FormFull>
        </FormGrid>
      </FormSection>
    </FormShell>
  );
}
