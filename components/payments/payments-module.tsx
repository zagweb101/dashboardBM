"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Wallet } from "lucide-react";
import type { Course } from "@/types/course";
import type { Student } from "@/types/student";
import type {
  PaymentStats,
  StudentPaymentWithDetails,
} from "@/types/payment";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "@/types/payment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  EmptyIcon,
  EmptyState,
  getEmptyCopy,
} from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  FormActions,
  FormAlert,
  FormFull,
  FormGrid,
  FormShell,
} from "@/components/ui/form-layout";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
import {
  createPaymentAction,
  deletePaymentAction,
} from "@/lib/courses/actions";
import {
  labelPaymentMethod,
  labelPaymentStatus,
  paymentStatusTone,
} from "@/lib/courses/labels";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

type Props = {
  initialPayments: StudentPaymentWithDetails[];
  stats: PaymentStats;
  students: Student[];
  courses: Course[];
  canCreate: boolean;
  canDelete: boolean;
};

export function PaymentsModule({
  initialPayments,
  stats,
  students,
  courses,
  canCreate,
  canDelete,
}: Props) {
  const { locale } = useLanguage();
  const { toast } = useToast();
  const ar = locale === "ar";

  const [payments, setPayments] = useState(initialPayments);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<StudentPaymentWithDetails | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (q) {
        const hay = [
          p.studentName,
          p.studentCode,
          p.reference ?? "",
          p.courseTitle ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [payments, query, statusFilter, methodFilter]);

  const onCreate = (formData: FormData) => {
    setFormError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await createPaymentAction(null, formData);
      if (!res.success || !res.payment) {
        setFormError(res.error ?? (ar ? "فشل الحفظ" : "Save failed"));
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      const student = students.find((s) => s.id === res.payment!.studentId);
      const course = res.payment!.courseId
        ? courses.find((c) => c.id === res.payment!.courseId)
        : null;
      setPayments((prev) => [
        {
          ...res.payment!,
          studentName: student?.fullName ?? "—",
          studentCode: student?.code ?? "—",
          courseTitle: course?.title ?? null,
        },
        ...prev,
      ]);
      setFormOpen(false);
      toast({
        title: ar ? "تم تسجيل الدفعة" : "Payment recorded",
        tone: "success",
      });
    });
  };

  const onDelete = () => {
    if (!deleting) return;
    startDelete(async () => {
      const res = await deletePaymentAction(deleting.id);
      if (res.success) {
        setPayments((prev) => prev.filter((p) => p.id !== deleting.id));
        toast({
          title: ar ? "تم حذف الدفعة" : "Payment deleted",
          tone: "success",
        });
        setDeleteOpen(false);
        setDeleting(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "مدفوعات المتدربين" : "Student payments"}
        description={
          ar
            ? "رسوم الدورات وإيرادات المركز (منفصلة عن اشتراك النظام في الفوترة)."
            : "Tuition fees & center revenue (separate from SaaS billing)."
        }
        action={
          canCreate ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {ar ? "تسجيل دفعة" : "Record payment"}
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={ar ? "المحصّل" : "Collected"}
          value={formatCurrency(stats.totalCollected, locale)}
          change={ar ? "مدفوعات مكتملة" : "Completed payments"}
          trend="up"
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <StatCard
          title={ar ? "بانتظار" : "Pending"}
          value={formatCurrency(stats.pendingAmount, locale)}
          change={ar ? "لم تُؤكد بعد" : "Awaiting confirmation"}
          trend="neutral"
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
        <StatCard
          title={ar ? "هذا الشهر" : "This month"}
          value={formatNumber(stats.paymentsThisMonth, locale)}
          change={ar ? "عملية" : "transactions"}
          trend="up"
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
        />
        <StatCard
          title={ar ? "مسترد" : "Refunded"}
          value={formatCurrency(stats.refundedAmount, locale)}
          change={`${formatNumber(stats.count, locale)} ${ar ? "إجمالي السجلات" : "total records"}`}
          trend="neutral"
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
        />
      </section>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <Input
          name="q"
          placeholder={
            ar
              ? "بحث بالمتدرب أو المرجع..."
              : "Search student or reference..."
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          name="status"
          options={[
            { value: "all", label: ar ? "كل الحالات" : "All statuses" },
            ...PAYMENT_STATUSES.map((s) => ({
              value: s,
              label: labelPaymentStatus(s, locale),
            })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Select
          name="method"
          options={[
            { value: "all", label: ar ? "كل الطرق" : "All methods" },
            ...PAYMENT_METHODS.map((s) => ({
              value: s,
              label: labelPaymentMethod(s, locale),
            })),
          ]}
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <EmptyIcon
              icon={getEmptyCopy("payments", ar ? "ar" : "en").Icon}
            />
          }
          title={getEmptyCopy("payments", ar ? "ar" : "en").title}
          description={
            getEmptyCopy("payments", ar ? "ar" : "en").description
          }
          action={
            canCreate ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                {getEmptyCopy("payments", ar ? "ar" : "en").action}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader
            title={ar ? "سجل المدفوعات" : "Payment ledger"}
            description={`${filtered.length} ${ar ? "سجل" : "records"}`}
          />
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-4 py-3 text-start font-semibold">
                    {ar ? "المتدرب" : "Student"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {ar ? "الدورة" : "Course"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {ar ? "المبلغ" : "Amount"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {ar ? "الطريقة" : "Method"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {ar ? "الحالة" : "Status"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {ar ? "التاريخ" : "Date"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/students/${p.studentId}`}
                        className="font-semibold hover:text-primary"
                      >
                        {p.studentName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.studentCode}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.courseTitle || "—"}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {formatCurrency(p.amount, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {labelPaymentMethod(p.method, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={paymentStatusTone[p.status]}>
                        {labelPaymentStatus(p.status, locale)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(p.paidAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {canDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-rose-600"
                          onClick={() => {
                            setDeleting(p);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={ar ? "تسجيل دفعة" : "Record payment"}
        description={
          ar
            ? "دفعة رسوم دورة — لا علاقة لها باشتراك Stripe للنظام."
            : "Tuition payment — unrelated to SaaS Stripe subscription."
        }
        size="lg"
      >
        <FormShell
          action={onCreate}
          actions={
            <FormActions>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setFormOpen(false)}
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto sm:min-w-[8rem]"
                disabled={pending}
              >
                {pending
                  ? ar
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : ar
                    ? "حفظ الدفعة"
                    : "Save payment"}
              </Button>
            </FormActions>
          }
        >
          {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}
          <FormGrid>
            <Select
              name="studentId"
              label={ar ? "المتدرب" : "Student"}
              required
              options={[
                {
                  value: "",
                  label: ar ? "اختر متدرباً" : "Select student",
                  disabled: true,
                },
                ...students.map((s) => ({
                  value: s.id,
                  label: `${s.fullName} (${s.code})`,
                })),
              ]}
              defaultValue=""
              error={fieldErrors.studentId}
            />
            <Select
              name="courseId"
              label={ar ? "الدورة (اختياري)" : "Course (optional)"}
              options={[
                { value: "", label: ar ? "— بدون —" : "— none —" },
                ...courses.map((c) => ({
                  value: c.id,
                  label: `${c.code} — ${c.title}`,
                })),
              ]}
              defaultValue=""
            />
            <Input
              name="amount"
              type="number"
              min={1}
              step={50}
              label={ar ? "المبلغ (ر.س)" : "Amount (SAR)"}
              required
              error={fieldErrors.amount}
              inputMode="decimal"
            />
            <Select
              name="method"
              label={ar ? "طريقة الدفع" : "Method"}
              options={PAYMENT_METHODS.map((m) => ({
                value: m,
                label: labelPaymentMethod(m, locale),
              }))}
              defaultValue="cash"
              error={fieldErrors.method}
            />
            <Select
              name="status"
              label={ar ? "الحالة" : "Status"}
              options={PAYMENT_STATUSES.map((s) => ({
                value: s,
                label: labelPaymentStatus(s, locale),
              }))}
              defaultValue="completed"
            />
            <Input
              name="paidAt"
              type="datetime-local"
              label={ar ? "تاريخ الدفع" : "Paid at"}
            />
            <FormFull>
              <Input
                name="reference"
                label={ar ? "المرجع / رقم الإيصال" : "Reference / receipt"}
                placeholder="TRX-..."
                dir="ltr"
                className="text-start"
              />
            </FormFull>
            <FormFull>
              <Textarea
                name="notes"
                label={ar ? "ملاحظات" : "Notes"}
                rows={2}
              />
            </FormFull>
          </FormGrid>
        </FormShell>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={ar ? "حذف الدفعة؟" : "Delete payment?"}
        description={
          deleting
            ? ar
              ? `حذف دفعة ${formatCurrency(deleting.amount, locale)} لـ ${deleting.studentName}`
              : `Remove ${formatCurrency(deleting.amount, locale)} for ${deleting.studentName}`
            : ""
        }
        confirmLabel={ar ? "حذف" : "Delete"}
        loading={deletePending}
        onConfirm={onDelete}
        tone="danger"
      />
    </div>
  );
}
