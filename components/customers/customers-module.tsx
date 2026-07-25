"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import type { Customer, CustomerFilters, CustomerStats } from "@/types/customer";
import { CUSTOMER_STATUSES } from "@/types/customer";
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
import {
  FormActions,
  FormAlert,
  FormFull,
  FormGrid,
  FormShell,
} from "@/components/ui/form-layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";
import {
  createCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
  type CustomerActionState,
} from "@/lib/customers/actions";
import {
  customerStatusTone,
  labelCustomerStatus,
} from "@/lib/customers/labels";
import { formatDate, formatNumber } from "@/lib/utils";
import { useActionState, useEffect } from "react";

type Props = {
  initialCustomers: Customer[];
  stats: CustomerStats;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

const initialState: CustomerActionState = { success: false };

export function CustomersModule({
  initialCustomers,
  stats,
  canCreate,
  canEdit,
  canDelete,
}: Props) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const { toast } = useToast();

  const [customers, setCustomers] = useState(initialCustomers);
  const [filters, setFilters] = useState<CustomerFilters>({
    query: "",
    status: "all",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [deletePending, startDelete] = useTransition();

  const action = mode === "create" ? createCustomerAction : updateCustomerAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && state.customer) {
      const c = state.customer;
      setCustomers((prev) => {
        const exists = prev.some((x) => x.id === c.id);
        return exists
          ? prev.map((x) => (x.id === c.id ? c : x))
          : [c, ...prev];
      });
      setFormOpen(false);
      setEditing(null);
      toast({
        title:
          mode === "create"
            ? ar
              ? "تم إضافة العميل"
              : "Customer created"
            : ar
              ? "تم التحديث"
              : "Customer updated",
        tone: "success",
      });
    }
  }, [state, mode, ar, toast]);

  const filtered = useMemo(() => {
    const q = filters.query?.trim().toLowerCase() ?? "";
    return customers.filter((c) => {
      if (filters.status && filters.status !== "all" && c.status !== filters.status) {
        return false;
      }
      if (q) {
        const hay = [c.name, c.email, c.phone ?? "", c.company ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customers, filters]);

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setMode("edit");
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "العملاء" : "Customers"}
        description={
          ar
            ? "شركاء B2B وجهات الاتصال — منفصلون عن المتدربين."
            : "B2B partners & contacts — separate from students."
        }
        action={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {ar ? "عميل جديد" : "Add customer"}
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={ar ? "الإجمالي" : "Total"}
          value={formatNumber(stats.total, locale)}
          change={ar ? "كل العملاء" : "All customers"}
          trend="neutral"
          icon={<Users className="h-5 w-5" />}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          title={ar ? "نشط" : "Active"}
          value={formatNumber(stats.active, locale)}
          change={ar ? "عملاء نشطون" : "Active accounts"}
          trend="up"
          icon={<Users className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <StatCard
          title={ar ? "فرص" : "Leads"}
          value={formatNumber(stats.lead, locale)}
          change={ar ? "بانتظار المتابعة" : "Pending follow-up"}
          trend="neutral"
          icon={<Users className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
        <StatCard
          title={ar ? "غير نشط" : "Inactive"}
          value={formatNumber(stats.inactive, locale)}
          change={ar ? "متوقفون" : "Paused"}
          trend="down"
          icon={<Users className="h-5 w-5" />}
          accent="bg-muted text-muted-foreground"
        />
      </section>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <Input
          name="q"
          placeholder={
            ar
              ? "بحث بالاسم أو البريد أو الشركة..."
              : "Search name, email, company..."
          }
          value={filters.query ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, query: e.target.value }))
          }
        />
        <Select
          name="status"
          options={[
            { value: "all", label: ar ? "كل الحالات" : "All statuses" },
            ...CUSTOMER_STATUSES.map((s) => ({
              value: s,
              label: labelCustomerStatus(s, locale),
            })),
          ]}
          value={filters.status ?? "all"}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value as CustomerFilters["status"],
            }))
          }
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <EmptyIcon
              icon={getEmptyCopy("customers", ar ? "ar" : "en").Icon}
            />
          }
          title={getEmptyCopy("customers", ar ? "ar" : "en").title}
          description={
            getEmptyCopy("customers", ar ? "ar" : "en").description
          }
          action={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {getEmptyCopy("customers", ar ? "ar" : "en").action}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "العميل" : "Customer"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "الشركة" : "Company"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "آخر تحديث" : "Updated"}
                </th>
                <th className="px-4 py-3 text-start font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.company || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={customerStatusTone[c.status]}>
                      {labelCustomerStatus(c.status, locale)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.updatedAt, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canEdit ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-rose-600"
                          onClick={() => {
                            setDeleting(c);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={
          mode === "create"
            ? ar
              ? "عميل جديد"
              : "New customer"
            : ar
              ? "تعديل عميل"
              : "Edit customer"
        }
        size="lg"
      >
        <FormShell
          action={formAction}
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
                className="w-full sm:w-auto sm:min-w-[7rem]"
                disabled={pending}
              >
                {pending
                  ? ar
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : ar
                    ? "حفظ"
                    : "Save"}
              </Button>
            </FormActions>
          }
        >
          {mode === "edit" && editing ? (
            <input type="hidden" name="id" value={editing.id} />
          ) : null}
          {state.error && !state.success ? (
            <FormAlert tone="error">{state.error}</FormAlert>
          ) : null}
          <FormGrid>
            <Input
              name="name"
              label={ar ? "الاسم" : "Name"}
              defaultValue={editing?.name}
              required
              error={state.fieldErrors?.name}
              autoComplete="name"
            />
            <Input
              name="email"
              type="email"
              label={ar ? "البريد" : "Email"}
              defaultValue={editing?.email}
              required
              error={state.fieldErrors?.email}
              dir="ltr"
              className="text-start"
              autoComplete="email"
            />
            <Input
              name="phone"
              label={ar ? "الجوال" : "Phone"}
              defaultValue={editing?.phone}
              dir="ltr"
              className="text-start"
              inputMode="tel"
            />
            <Input
              name="company"
              label={ar ? "الشركة" : "Company"}
              defaultValue={editing?.company}
            />
            <Select
              name="status"
              label={ar ? "الحالة" : "Status"}
              options={CUSTOMER_STATUSES.map((s) => ({
                value: s,
                label: labelCustomerStatus(s, locale),
              }))}
              defaultValue={editing?.status ?? "lead"}
            />
            <FormFull>
              <Textarea
                name="notes"
                label={ar ? "ملاحظات" : "Notes"}
                defaultValue={editing?.notes}
                rows={3}
              />
            </FormFull>
          </FormGrid>
        </FormShell>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={ar ? "حذف العميل؟" : "Delete customer?"}
        description={
          deleting
            ? ar
              ? `سيتم حذف «${deleting.name}» نهائياً.`
              : `“${deleting.name}” will be permanently removed.`
            : ""
        }
        confirmLabel={ar ? "حذف" : "Delete"}
        loading={deletePending}
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;
          startDelete(async () => {
            const res = await deleteCustomerAction(deleting.id);
            if (res.success) {
              setCustomers((prev) =>
                prev.filter((c) => c.id !== deleting.id),
              );
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
