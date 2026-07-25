"use client";

/**
 * Revenue mix — النسب خارج الدائرة لتجنب التداخل
 * موبايل: الدائرة فوق + قائمة تحت
 * ديسكتوب: عمودان (دائرة + أسطورة)
 */
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartSlice } from "@/types/dashboard";
import { cn } from "@/lib/utils";

type DonutChartProps = {
  data: ChartSlice[];
  className?: string;
};

export function DonutChart({ data, className }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div
      className={cn(
        // عمودي على الموبايل، أفقي من md
        "flex h-full min-h-0 flex-col gap-5 md:flex-row md:items-center md:gap-6",
        className,
      )}
    >
      {/* الدائرة — بدون labels على القطاعات */}
      <div className="relative mx-auto h-52 w-full max-w-[220px] shrink-0 sm:h-56 md:mx-0 md:w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={4}
              strokeWidth={0}
              // لا نستخدم label على القطاعات — يمنع التزاحم
              isAnimationActive
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value}%`,
                String(name ?? ""),
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--card-foreground)",
                fontSize: 12,
                boxShadow: "var(--shadow-soft)",
              }}
              itemStyle={{ padding: 0 }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* مركز الدائرة — نص مضغوط بلا تداخل */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-6 text-center">
          <span className="text-[11px] font-medium leading-none text-muted-foreground">
            الإجمالي
          </span>
          <span className="text-xl font-extrabold tabular-nums leading-tight text-card-foreground sm:text-2xl">
            {total}
            <span className="ms-0.5 text-sm font-bold text-muted-foreground">
              %
            </span>
          </span>
        </div>
      </div>

      {/* الأسطورة — تحت على الموبايل، بجانب على الديسكتوب */}
      <ul className="grid w-full min-w-0 flex-1 grid-cols-1 gap-2.5 xs:grid-cols-2 md:grid-cols-1">
        {data.map((item) => (
          <li
            key={item.name}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/80 bg-muted/20 px-3 py-2.5"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">
              {item.name}
            </span>
            <span className="shrink-0 text-sm font-extrabold tabular-nums text-card-foreground">
              {item.value}
              <span className="text-xs font-semibold text-muted-foreground">
                ٪
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
