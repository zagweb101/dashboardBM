"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LinePoint } from "@/types/dashboard";

type UsersLineChartProps = {
  data: LinePoint[];
};

export function UsersLineChart({ data }: UsersLineChartProps) {
  return (
    <div className="h-64 w-full min-w-0 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            height={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
              fontSize: 12,
            }}
            formatter={(value) => [Number(value).toLocaleString("ar-SA"), ""]}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) =>
              value === "users" ? "المستخدمون" : "الجلسات"
            }
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#e11d48"
            strokeWidth={3}
            dot={{ r: 3, fill: "#e11d48" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="#94a3b8"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#94a3b8" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
