import type { Metadata } from "next";
import {
  ChartCard,
  DonutChart,
  NotificationCard,
  RevenueBarChart,
  StatCard,
  UsersLineChart,
} from "@/components/dashboard";
import { DashboardTables } from "@/components/dashboard/dashboard-tables";
import {
  barData,
  donutData,
  latestPayments,
  latestUsers,
  lineData,
  notifications,
  statsCards,
} from "@/data/dashboard";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

/**
 * Server Component — يمرّر بيانات فقط (لا functions) إلى Client Components.
 * جداول Latest payments/users: عبر DashboardTables (client).
 */
export default async function DashboardPage() {
  await requirePermission("dashboard:view");

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على أداء المركز والإيرادات والنشاط."
      />

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

      {/* Client only: columns + cell renderers defined inside */}
      <DashboardTables payments={latestPayments} users={latestUsers} />
    </div>
  );
}
