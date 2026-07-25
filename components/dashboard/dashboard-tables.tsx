"use client";

/**
 * جداول الداشبورد — Client Component
 *
 * يعرّف cell/columns هنا حتى لا تُمرَّر دوال من Server page.
 * الـ Server يمرّر فقط data قابلة للتسلسل (arrays of plain objects).
 */
import Link from "next/link";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { PaymentRow, UserRow } from "@/types/dashboard";

type Props = {
  payments: PaymentRow[];
  users: UserRow[];
};

const paymentColumns: Column<PaymentRow>[] = [
  {
    key: "customer",
    header: "العميل",
    cell: (row) => (
      <span className="font-semibold break-words">{row.customer}</span>
    ),
  },
  {
    key: "amount",
    header: "المبلغ",
    cell: (row) => (
      <span className="font-bold tabular-nums" dir="auto">
        {row.amount}
      </span>
    ),
  },
  {
    key: "method",
    header: "الطريقة",
    cell: (row) => (
      <span className="text-muted-foreground">{row.method}</span>
    ),
  },
  {
    key: "date",
    header: "التاريخ",
    cell: (row) => (
      <span className="tabular-nums text-muted-foreground" dir="auto">
        {row.date}
      </span>
    ),
  },
  {
    key: "status",
    header: "الحالة",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

const userColumns: Column<UserRow>[] = [
  {
    key: "name",
    header: "المستخدم",
    cell: (row) => (
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold leading-snug break-words">{row.name}</p>
        <p
          className="truncate text-xs text-muted-foreground"
          dir="ltr"
          title={row.email}
        >
          {row.email}
        </p>
      </div>
    ),
  },
  {
    key: "role",
    header: "الدور",
    cell: (row) => <span className="whitespace-nowrap">{row.role}</span>,
  },
  {
    key: "joinedAt",
    header: "الانضمام",
    cell: (row) => (
      <span className="tabular-nums text-muted-foreground" dir="auto">
        {row.joinedAt}
      </span>
    ),
  },
  {
    key: "status",
    header: "الحالة",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
    >
      {label}
    </Link>
  );
}

export function DashboardTables({ payments, users }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DataTable
        title="أحدث المدفوعات"
        description="آخر العمليات المالية"
        columns={paymentColumns}
        data={payments}
        rowKeyField="id"
        action={<ViewAllLink href="/billing" label="عرض الكل" />}
      />
      <DataTable
        title="أحدث المستخدمين"
        description="انضمامات ودعوات حديثة"
        columns={userColumns}
        data={users}
        rowKeyField="id"
        action={<ViewAllLink href="/customers" label="عرض الكل" />}
      />
    </section>
  );
}
