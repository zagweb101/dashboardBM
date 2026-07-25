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

export const metadata: Metadata = {
  title: "Dashboard",
};

const paymentColumns: Column<PaymentRow>[] = [
  {
    key: "customer",
    header: "Customer",
    cell: (row) => row.customer,
  },
  {
    key: "amount",
    header: "Amount",
    cell: (row) => <span className="font-semibold">{row.amount}</span>,
  },
  {
    key: "method",
    header: "Method",
    cell: (row) => row.method,
  },
  {
    key: "date",
    header: "Date",
    cell: (row) => row.date,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

const userColumns: Column<UserRow>[] = [
  {
    key: "name",
    header: "User",
    cell: (row) => (
      <div>
        <p className="font-semibold">{row.name}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    cell: (row) => row.role,
  },
  {
    key: "joinedAt",
    header: "Joined",
    cell: (row) => row.joinedAt,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
    >
      View all
    </Link>
  );
}

export default async function DashboardPage() {
  await requirePermission("dashboard:view");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Revenue mix"
          description="Income sources this month"
          className="xl:col-span-1"
        >
          <DonutChart data={donutData} />
        </ChartCard>

        <ChartCard
          title="Revenue & profit"
          description="Monthly comparison (last 6 months)"
          className="xl:col-span-2"
        >
          <RevenueBarChart data={barData} />
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="User activity"
          description="Users and sessions this week"
          className="xl:col-span-2"
        >
          <UsersLineChart data={lineData} />
        </ChartCard>

        <NotificationCard items={notifications} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DataTable
          title="Latest payments"
          description="Recent financial transactions"
          columns={paymentColumns}
          data={latestPayments}
          rowKey={(row) => row.id}
          action={<ViewAllLink href="/billing" />}
        />
        <DataTable
          title="Latest users"
          description="Recent joins and invitations"
          columns={userColumns}
          data={latestUsers}
          rowKey={(row) => row.id}
          action={<ViewAllLink href="/customers" />}
        />
      </section>
    </div>
  );
}
