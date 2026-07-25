import type { Metadata } from "next";
import {
  ChartCard,
  RevenueBarChart,
  StatCard,
  UsersLineChart,
} from "@/components/dashboard";
import { barData, lineData } from "@/data/dashboard";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import {
  Activity,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  await requirePermission("analytics:view");
  const analytics = await db.getAnalytics();
  const latest = analytics[analytics.length - 1];
  const previous = analytics[analytics.length - 2];

  const revenueChange =
    previous && previous.revenue
      ? (latest.revenue - previous.revenue) / previous.revenue
      : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue (month)"
          value={formatCurrency(latest?.revenue ?? 0, "en")}
          change={formatPercent(revenueChange, "en")}
          trend={revenueChange >= 0 ? "up" : "down"}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Customers"
          value={formatNumber(latest?.customers ?? 0, "en")}
          change="+8.4%"
          trend="up"
          icon={<Users className="h-5 w-5" />}
          accent="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
        />
        <StatCard
          title="Churn"
          value={`${latest?.churn ?? 0}%`}
          change="-0.2pp"
          trend="up"
          icon={<TrendingDown className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
        <StatCard
          title="Activation"
          value="64%"
          change="+3.1%"
          trend="up"
          icon={<Activity className="h-5 w-5" />}
          accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Revenue trajectory"
          description="Mock analytics series ready for Supabase"
        >
          <RevenueBarChart data={barData} />
        </ChartCard>
        <ChartCard
          title="Engagement"
          description="Users vs sessions"
        >
          <UsersLineChart data={lineData} />
        </ChartCard>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-bold">Monthly snapshot</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Source: lib/db mock layer
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="px-5 py-3 text-start font-semibold">Month</th>
                <th className="px-5 py-3 text-start font-semibold">Revenue</th>
                <th className="px-5 py-3 text-start font-semibold">Customers</th>
                <th className="px-5 py-3 text-start font-semibold">Churn</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{row.label}</td>
                  <td className="px-5 py-3">
                    {formatCurrency(row.revenue, "en")}
                  </td>
                  <td className="px-5 py-3">{formatNumber(row.customers, "en")}</td>
                  <td className="px-5 py-3">{row.churn}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
