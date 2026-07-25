"use client";

import { useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import type { Course, CourseFilters, CourseStats } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormActions } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  EmptyIcon,
  EmptyState,
  getEmptyCopy,
} from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
import { StatCard } from "@/components/dashboard/StatCard";
import { CourseForm } from "@/components/courses/course-form";
import { deleteCourseAction } from "@/lib/courses/actions";
import {
  courseStatusTone,
  labelCourseCategory,
  labelCourseLevel,
  labelCourseStatus,
} from "@/lib/courses/labels";
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  COURSE_STATUSES,
} from "@/types/course";
import { formatCurrency, formatNumber } from "@/lib/utils";

type Props = {
  initialCourses: Course[];
  stats: CourseStats;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function CoursesModule({
  initialCourses,
  stats,
  canCreate,
  canEdit,
  canDelete,
}: Props) {
  const { locale } = useLanguage();
  const { toast } = useToast();
  const ar = locale === "ar";
  const courseFormId = useId();

  const [courses, setCourses] = useState(initialCourses);
  const [filters, setFilters] = useState<CourseFilters>({
    query: "",
    status: "all",
    level: "all",
    category: "all",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [formPending, setFormPending] = useState(false);

  const filtered = useMemo(() => {
    const q = filters.query?.trim().toLowerCase() ?? "";
    return courses.filter((c) => {
      if (q) {
        const hay = [c.title, c.code, c.instructorName ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status && filters.status !== "all" && c.status !== filters.status) {
        return false;
      }
      if (filters.level && filters.level !== "all" && c.level !== filters.level) {
        return false;
      }
      if (
        filters.category &&
        filters.category !== "all" &&
        c.category !== filters.category
      ) {
        return false;
      }
      return true;
    });
  }, [courses, filters]);

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setFormMode("edit");
    setEditing(course);
    setFormOpen(true);
  };

  const onDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteCourseAction(deleting.id);
      if (res.success) {
        setCourses((prev) => prev.filter((c) => c.id !== deleting.id));
        toast({
          title: ar ? "تم حذف الدورة" : "Course deleted",
          tone: "success",
        });
        setDeleteOpen(false);
        setDeleting(null);
      } else {
        toast({
          title: ar ? "تعذّر الحذف" : "Delete failed",
          description: res.error,
          tone: "error",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "الدورات" : "Courses"}
        description={
          ar
            ? "كتالوج دورات التصوير، المقاعد، والتسجيلات."
            : "Photography course catalog, seats, and enrollments."
        }
        action={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {ar ? "دورة جديدة" : "New course"}
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={ar ? "إجمالي الدورات" : "Total courses"}
          value={formatNumber(stats.total, locale)}
          change={ar ? "كل الكتالوج" : "Catalog"}
          trend="neutral"
          icon={<BookOpen className="h-5 w-5" />}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          title={ar ? "مفتوحة للتسجيل" : "Open"}
          value={formatNumber(stats.open, locale)}
          change={`${formatNumber(stats.inProgress, locale)} ${ar ? "جارية" : "in progress"}`}
          trend="up"
          icon={<Users className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <StatCard
          title={ar ? "المقاعد المشغولة" : "Filled seats"}
          value={`${formatNumber(stats.filledSeats, locale)} / ${formatNumber(stats.totalSeats, locale)}`}
          change={ar ? "عبر كل الدورات" : "Across all courses"}
          trend="neutral"
          icon={<Users className="h-5 w-5" />}
          accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
        />
        <StatCard
          title={ar ? "منتهية" : "Completed"}
          value={formatNumber(stats.completed, locale)}
          change={ar ? "دورات مكتملة" : "Finished cohorts"}
          trend="neutral"
          icon={<BookOpen className="h-5 w-5" />}
          accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
        />
      </section>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
        <Input
          name="q"
          placeholder={ar ? "بحث بالعنوان أو الرمز..." : "Search title or code..."}
          value={filters.query ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
        />
        <Select
          name="status"
          options={[
            { value: "all", label: ar ? "كل الحالات" : "All statuses" },
            ...COURSE_STATUSES.map((s) => ({
              value: s,
              label: labelCourseStatus(s, locale),
            })),
          ]}
          value={filters.status ?? "all"}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value as CourseFilters["status"],
            }))
          }
        />
        <Select
          name="level"
          options={[
            { value: "all", label: ar ? "كل المستويات" : "All levels" },
            ...COURSE_LEVELS.map((s) => ({
              value: s,
              label: labelCourseLevel(s, locale),
            })),
          ]}
          value={filters.level ?? "all"}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              level: e.target.value as CourseFilters["level"],
            }))
          }
        />
        <Select
          name="category"
          options={[
            { value: "all", label: ar ? "كل التصنيفات" : "All categories" },
            ...COURSE_CATEGORIES.map((s) => ({
              value: s,
              label: labelCourseCategory(s, locale),
            })),
          ]}
          value={filters.category ?? "all"}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              category: e.target.value as CourseFilters["category"],
            }))
          }
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <EmptyIcon
              icon={getEmptyCopy("courses", ar ? "ar" : "en").Icon}
            />
          }
          title={getEmptyCopy("courses", ar ? "ar" : "en").title}
          description={getEmptyCopy("courses", ar ? "ar" : "en").description}
          action={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {getEmptyCopy("courses", ar ? "ar" : "en").action}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <article
              key={course.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {course.code}
                  </p>
                  <h3 className="mt-1 text-base font-bold leading-snug">
                    <Link
                      href={`/courses/${course.id}`}
                      className="hover:text-primary"
                    >
                      {course.title}
                    </Link>
                  </h3>
                </div>
                <Badge tone={courseStatusTone[course.status]}>
                  {labelCourseStatus(course.status, locale)}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-lg bg-muted px-2 py-1">
                  {labelCourseCategory(course.category, locale)}
                </span>
                <span className="rounded-lg bg-muted px-2 py-1">
                  {labelCourseLevel(course.level, locale)}
                </span>
                {course.instructorName ? (
                  <span className="rounded-lg bg-muted px-2 py-1">
                    {course.instructorName}
                  </span>
                ) : null}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {ar ? "السعر" : "Price"}
                  </dt>
                  <dd className="font-bold">
                    {formatCurrency(course.price, locale)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {ar ? "المقاعد" : "Seats"}
                  </dt>
                  <dd className="font-bold">
                    {course.enrolledCount}/{course.maxSeats}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">
                    {ar ? "المواعيد" : "Schedule"}
                  </dt>
                  <dd className="font-medium">
                    {course.scheduleNote || "—"}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
                <Link
                  href={`/courses/${course.id}`}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold transition hover:border-primary/30"
                >
                  {ar ? "التفاصيل" : "Details"}
                </Link>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(course)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {ar ? "تعديل" : "Edit"}
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600"
                    onClick={() => {
                      setDeleting(course);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setFormPending(false);
        }}
        title={
          formMode === "create"
            ? ar
              ? "دورة جديدة"
              : "New course"
            : ar
              ? "تعديل الدورة"
              : "Edit course"
        }
        description={
          ar
            ? "بيانات الدورة تظهر للمتدربين عند التسجيل."
            : "Course details shown when enrolling students."
        }
        size="xl"
        footer={
          <FormActions>
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full sm:h-11 sm:w-auto"
              onClick={() => setFormOpen(false)}
              disabled={formPending}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              form={courseFormId}
              className="h-12 w-full sm:h-11 sm:w-auto sm:min-w-[9rem]"
              disabled={formPending}
            >
              {formPending
                ? ar
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : formMode === "create"
                  ? ar
                    ? "إنشاء الدورة"
                    : "Create course"
                  : ar
                    ? "حفظ التغييرات"
                    : "Save changes"}
            </Button>
          </FormActions>
        }
      >
        <CourseForm
          formId={courseFormId}
          key={editing?.id ?? "create"}
          mode={formMode}
          course={editing ?? undefined}
          onPendingChange={setFormPending}
          onSuccess={(course) => {
            setCourses((prev) => {
              const exists = prev.some((c) => c.id === course.id);
              return exists
                ? prev.map((c) => (c.id === course.id ? course : c))
                : [course, ...prev];
            });
            setFormOpen(false);
            toast({
              title:
                formMode === "create"
                  ? ar
                    ? "تم إنشاء الدورة"
                    : "Course created"
                  : ar
                    ? "تم تحديث الدورة"
                    : "Course updated",
              tone: "success",
            });
          }}
        />
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={ar ? "حذف الدورة؟" : "Delete course?"}
        description={
          deleting
            ? ar
              ? `سيتم حذف «${deleting.title}» إن لم يكن لديها تسجيلات نشطة.`
              : `“${deleting.title}” will be removed if it has no active enrollments.`
            : ""
        }
        confirmLabel={ar ? "حذف" : "Delete"}
        loading={pending}
        onConfirm={onDelete}
        tone="danger"
      />
    </div>
  );
}
