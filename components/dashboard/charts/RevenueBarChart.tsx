"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarPoint } from "@/types/dashboard";

type RevenueBarChartProps = {
  data: BarPoint[];
};

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  return (
    <div className="h-64 w-full min-w-0 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barGap={6}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            height={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v) =>
              Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}ك` : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
              fontSize: 12,
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString("ar-SA")} ر.س`,
              "",
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) =>
              value === "revenue" ? "الإيرادات" : "الأرباح"
            }
          />
          <Bar
            dataKey="revenue"
            fill="#e11d48"
            radius={[8, 8, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="profit"
            fill="#fda4af"
            radius={[8, 8, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
