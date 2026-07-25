"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartSlice } from "@/types/dashboard";

type DonutChartProps = {
  data: ChartSlice[];
};

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-56 w-full max-w-[240px] sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}%`, "النسبة"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--card-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">الإجمالي</span>
          <span className="text-2xl font-extrabold text-card-foreground">
            {total}%
          </span>
        </div>
      </div>

      <ul className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-1">
        {data.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
            <span className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="text-sm font-bold">{item.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
