import Link from "next/link";
import type { Metadata } from "next";
import {
  ChartCard,
  DataTable,
  DonutChart,
  NotificationCard,
  RevenueBarChart,
  StatCard,
  StatusBadge,
  UsersLineChart,
  type Column,
} from "@/components/dashboard";
import {
  barData,
  donutData,
  latestPayments,
  latestUsers,
  lineData,
  notifications,
  statsCards,
} from "@/data/dashboard";
import type { PaymentRow, UserRow } from "@/types/dashboard";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "لوحة التحكم",
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

export default async function DashboardPage() {
  await requirePermission("dashboard:view");

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على أداء المركز والإيرادات والنشاط."
      />

      {/* بطاقات — شبكة تمنع الضغط على الشاشات الضيقة */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              accent={stat.accent}
              icon={<Icon className="h-5 w-5" />}
            />
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="مزيج الإيرادات"
          description="مصادر الدخل هذا الشهر"
          className="min-w-0 xl:col-span-1"
          bodyClassName="pt-1"
        >
          <DonutChart data={donutData} />
        </ChartCard>

        <ChartCard
          title="الإيرادات والأرباح"
          description="مقارنة شهرية (آخر 6 أشهر)"
          className="min-w-0 xl:col-span-2"
        >
          <RevenueBarChart data={barData} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="نشاط المستخدمين"
          description="المستخدمون والجلسات هذا الأسبوع"
          className="min-w-0 xl:col-span-2"
        >
          <UsersLineChart data={lineData} />
        </ChartCard>

        <NotificationCard items={notifications} className="min-w-0" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DataTable
          title="أحدث المدفوعات"
          description="آخر العمليات المالية"
          columns={paymentColumns}
          data={latestPayments}
          rowKey={(row) => row.id}
          action={<ViewAllLink href="/billing" label="عرض الكل" />}
        />
        <DataTable
          title="أحدث المستخدمين"
          description="انضمامات ودعوات حديثة"
          columns={userColumns}
          data={latestUsers}
          rowKey={(row) => row.id}
          action={<ViewAllLink href="/customers" label="عرض الكل" />}
        />
      </section>
    </div>
  );
}
