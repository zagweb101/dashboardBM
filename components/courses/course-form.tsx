"use client";

import { useActionState, useEffect, useMemo } from "react";
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  COURSE_STATUSES,
  type Course,
} from "@/types/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  mode: "create" | "edit";
  course?: Course;
  onSuccess?: (course: Course) => void;
  onCancel?: () => void;
};

const initialState: ActionState = { success: false };

export function CourseForm({
  mode,
  course,
  onSuccess,
  onCancel,
}: CourseFormProps) {
  const { locale } = useLanguage();
  const action = mode === "create" ? createCourseAction : updateCourseAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && state.course) onSuccess?.(state.course);
  }, [state, onSuccess]);

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
  const ar = locale === "ar";

  return (
    <form action={formAction} className="space-y-5">
      {mode === "edit" && course ? (
        <input type="hidden" name="id" value={course.id} />
      ) : null}

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            name="title"
            label={ar ? "عنوان الدورة" : "Course title"}
            defaultValue={course?.title}
            error={fe("title")}
            required
            placeholder={ar ? "مثال: أساسيات التصوير" : "e.g. Photography basics"}
          />
        </div>
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
        <Input
          name="price"
          type="number"
          min={0}
          step={50}
          label={ar ? "السعر (ر.س)" : "Price (SAR)"}
          defaultValue={course?.price ?? 1500}
          error={fe("price")}
          required
        />
        <Input
          name="maxSeats"
          type="number"
          min={1}
          label={ar ? "المقاعد" : "Seats"}
          defaultValue={course?.maxSeats ?? 12}
          error={fe("maxSeats")}
          required
        />
        <Input
          name="durationHours"
          type="number"
          min={1}
          label={ar ? "الساعات" : "Hours"}
          defaultValue={course?.durationHours ?? 18}
          error={fe("durationHours")}
          required
        />
        <Input
          name="sessionsCount"
          type="number"
          min={1}
          label={ar ? "عدد الجلسات" : "Sessions"}
          defaultValue={course?.sessionsCount ?? 6}
          error={fe("sessionsCount")}
          required
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
        <div className="md:col-span-2">
          <Input
            name="scheduleNote"
            label={ar ? "جدول المواعيد" : "Schedule note"}
            defaultValue={course?.scheduleNote}
            placeholder={ar ? "أحد وثلاثاء · 6م" : "Sun & Tue · 6pm"}
          />
        </div>
        <div className="md:col-span-2">
          <Textarea
            name="description"
            label={ar ? "الوصف" : "Description"}
            defaultValue={course?.description}
            rows={3}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending
            ? ar
              ? "جارٍ الحفظ..."
              : "Saving..."
            : mode === "create"
              ? ar
                ? "إنشاء الدورة"
                : "Create course"
              : ar
                ? "حفظ التغييرات"
                : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
