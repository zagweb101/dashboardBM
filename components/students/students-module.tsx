"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import type {
  Student,
  StudentFilters,
  StudentSort,
  StudentStats,
} from "@/types/student";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
import { deleteStudentAction } from "@/lib/students/actions";
import { StudentsStats } from "@/components/students/students-stats";
import { StudentsFilters } from "@/components/students/students-filters";
import { StudentsTable } from "@/components/students/students-table";
import { StudentForm } from "@/components/students/student-form";
import { StudentDetailSheet } from "@/components/students/student-detail-sheet";

const PAGE_SIZE = 8;

const defaultFilters: StudentFilters = {
  query: "",
  status: "all",
  level: "all",
  source: "all",
  gender: "all",
  city: "all",
};

type StudentsModuleProps = {
  initialStudents: Student[];
  stats: StudentStats;
  cities: string[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function StudentsModule({
  initialStudents,
  stats,
  cities,
  canCreate,
  canEdit,
  canDelete,
}: StudentsModuleProps) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const [students, setStudents] = useState(initialStudents);
  const [filters, setFilters] = useState<StudentFilters>(defaultFilters);
  const [sort, setSort] = useState<StudentSort>({
    key: "joinedAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Student | null>(null);

  const [viewing, setViewing] = useState<Student | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [deleting, setDeleting] = useState<Student | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPending, startDeleteTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = filters.query?.trim().toLowerCase() ?? "";

    let rows = students.filter((student) => {
      if (q) {
        const hay = [
          student.fullName,
          student.email,
          student.phone,
          student.code,
          student.city,
          student.nationalId ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status && filters.status !== "all" && student.status !== filters.status) {
        return false;
      }
      if (filters.level && filters.level !== "all" && student.level !== filters.level) {
        return false;
      }
      if (filters.source && filters.source !== "all" && student.source !== filters.source) {
        return false;
      }
      if (filters.gender && filters.gender !== "all" && student.gender !== filters.gender) {
        return false;
      }
      if (filters.city && filters.city !== "all" && student.city !== filters.city) {
        return false;
      }
      return true;
    });

    const dir = sort.direction === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      if (sort.key === "joinedAt") {
        return (
          (new Date(String(av)).getTime() - new Date(String(bv)).getTime()) *
          dir
        );
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), "ar") * dir;
    });

    return rows;
  }, [students, filters, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(student: Student) {
    setFormMode("edit");
    setEditing(student);
    setFormOpen(true);
  }

  function openView(student: Student) {
    setViewing(student);
    setViewOpen(true);
  }

  function openDelete(student: Student) {
    setDeleting(student);
    setDeleteOpen(true);
  }

  function handleSuccess(student: Student) {
    setStudents((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      if (exists) {
        return prev.map((s) => (s.id === student.id ? student : s));
      }
      return [student, ...prev];
    });
    setFormOpen(false);
    setEditing(null);
    toast({
      title: formMode === "create" ? t("studentCreated") : t("studentUpdated"),
      description: student.fullName,
      tone: "success",
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    startDeleteTransition(async () => {
      const result = await deleteStudentAction(target.id);
      if (!result.success) {
        toast({
          title: t("error"),
          description: result.error ?? t("studentDeleteFailed"),
          tone: "error",
        });
        return;
      }
      setStudents((prev) => prev.filter((s) => s.id !== target.id));
      setDeleteOpen(false);
      setDeleting(null);
      toast({
        title: t("studentDeleted"),
        description: target.fullName,
        tone: "success",
      });
    });
  }

  function exportCsv() {
    const header = [
      "code",
      "fullName",
      "email",
      "phone",
      "city",
      "status",
      "level",
      "source",
      "totalPaid",
      "joinedAt",
    ];
    const lines = [
      header.join(","),
      ...filtered.map((s) =>
        [
          s.code,
          `"${s.fullName.replace(/"/g, '""')}"`,
          s.email,
          s.phone,
          s.city,
          s.status,
          s.level,
          s.source,
          s.totalPaid,
          s.joinedAt,
        ].join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: t("exportReady"),
      description: `${filtered.length} ${t("records")}`,
      tone: "success",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">
            {t("students")}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {t("studentsSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilters(defaultFilters);
              setSort({ key: "joinedAt", direction: "desc" });
              setPage(1);
            }}
          >
            <RefreshCw className="h-4 w-4" />
            {t("reset")}
          </Button>
          {canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("addStudent")}
            </Button>
          ) : null}
        </div>
      </div>

      <StudentsStats stats={stats} />

      <StudentsFilters
        value={filters}
        cities={cities}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onReset={() => {
          setFilters(defaultFilters);
          setPage(1);
        }}
      />

      <StudentsTable
        students={pageRows}
        sort={sort}
        page={safePage}
        pageSize={PAGE_SIZE}
        total={total}
        canEdit={canEdit}
        canDelete={canDelete}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={openDelete}
        onView={openView}
      />

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? t("addStudent") : t("editStudent")}
        description={
          formMode === "create"
            ? t("addStudentCopy")
            : t("editStudentCopy")
        }
        size="xl"
      >
        <StudentForm
          key={editing?.id ?? "create"}
          mode={formMode}
          student={editing ?? undefined}
          onCancel={() => setFormOpen(false)}
          onSuccess={handleSuccess}
        />
      </Dialog>

      <StudentDetailSheet
        student={viewing}
        open={viewOpen}
        onOpenChange={setViewOpen}
        canEdit={canEdit}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteStudent")}
        description={
          locale === "ar"
            ? `هل أنت متأكد من حذف المتدرب «${deleting?.fullName ?? ""}»؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Delete student “${deleting?.fullName ?? ""}”? This cannot be undone.`
        }
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        tone="danger"
        loading={deletingPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
