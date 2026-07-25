"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Report } from "@/types/report";
import { REPORT_TYPES } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyIcon,
  EmptyState,
  getEmptyCopy,
} from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";
import {
  createReportAction,
  deleteReportAction,
  type ReportActionState,
} from "@/lib/reports/actions";
import { labelReportType, reportTypeTone } from "@/lib/reports/labels";
import { formatDate } from "@/lib/utils";

type Props = {
  initialReports: Report[];
  canCreate: boolean;
  canDelete: boolean;
};

const initialState: ReportActionState = { success: false };

export function ReportsModule({
  initialReports,
  canCreate,
  canDelete,
}: Props) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const { toast } = useToast();

  const [reports, setReports] = useState(initialReports);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Report | null>(null);
  const [deletePending, startDelete] = useTransition();

  const [state, formAction, pending] = useActionState(
    createReportAction,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.report) {
      setReports((prev) => [state.report!, ...prev]);
      setFormOpen(false);
      toast({
        title: ar ? "تم إنشاء التقرير" : "Report created",
        tone: "success",
      });
    }
  }, [state, ar, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reports, typeFilter, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "التقارير" : "Reports"}
        description={
          ar
            ? "تقارير المبيعات والحضور والمالية — محفوظة في النظام."
            : "Sales, attendance, and financial reports stored in the system."
        }
        action={
          canCreate ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {ar ? "تقرير جديد" : "New report"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <Input
          name="q"
          placeholder={ar ? "بحث بالعنوان..." : "Search title..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          name="type"
          options={[
            { value: "all", label: ar ? "كل الأنواع" : "All types" },
            ...REPORT_TYPES.map((t) => ({
              value: t,
              label: labelReportType(t, locale),
            })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <EmptyIcon
              icon={getEmptyCopy("reports", ar ? "ar" : "en").Icon}
            />
          }
          title={getEmptyCopy("reports", ar ? "ar" : "en").title}
          description={getEmptyCopy("reports", ar ? "ar" : "en").description}
          action={
            canCreate ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                {getEmptyCopy("reports", ar ? "ar" : "en").action}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge tone={reportTypeTone[r.type]}>
                    {labelReportType(r.type, locale)}
                  </Badge>
                  <h3 className="mt-2 text-base font-bold">{r.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(r.createdAt, locale)}
                    {r.createdByName ? ` · ${r.createdByName}` : ""}
                  </p>
                </div>
                {canDelete ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() => {
                      setDeleting(r);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
              {Object.keys(r.filters ?? {}).length > 0 ? (
                <pre className="mt-3 overflow-x-auto rounded-xl bg-muted/50 p-3 text-[11px] text-muted-foreground" dir="ltr">
                  {JSON.stringify(r.filters, null, 2)}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={ar ? "تقرير جديد" : "New report"}
        description={
          ar
            ? "يُحفظ التقرير مع فلاتر اختيارية بصيغة JSON"
            : "Saved with optional JSON filters"
        }
        size="lg"
      >
        <form action={formAction} className="space-y-4">
          {state.error && !state.success ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}
          <Input
            name="title"
            label={ar ? "العنوان" : "Title"}
            required
            error={state.fieldErrors?.title}
            placeholder={
              ar ? "مثال: حضور دورة أساسيات" : "e.g. Basics course attendance"
            }
          />
          <Select
            name="type"
            label={ar ? "النوع" : "Type"}
            options={REPORT_TYPES.map((t) => ({
              value: t,
              label: labelReportType(t, locale),
            }))}
            defaultValue="custom"
          />
          <Textarea
            name="filters"
            label={ar ? "فلاتر (JSON اختياري)" : "Filters (optional JSON)"}
            rows={4}
            placeholder='{"month":"2026-07"}'
            error={state.fieldErrors?.filters}
            dir="ltr"
          />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? ar
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : ar
                  ? "إنشاء التقرير"
                  : "Create report"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={ar ? "حذف التقرير؟" : "Delete report?"}
        description={
          deleting
            ? ar
              ? `حذف «${deleting.title}»`
              : `Remove “${deleting.title}”`
            : ""
        }
        confirmLabel={ar ? "حذف" : "Delete"}
        loading={deletePending}
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;
          startDelete(async () => {
            const res = await deleteReportAction(deleting.id);
            if (res.success) {
              setReports((prev) => prev.filter((r) => r.id !== deleting.id));
              toast({
                title: ar ? "تم الحذف" : "Deleted",
                tone: "success",
              });
              setDeleteOpen(false);
              setDeleting(null);
            }
          });
        }}
      />
    </div>
  );
}
