"use client";

/**
 * Revenue mix — النسب خارج الدائرة لتجنب التداخل
 * موبايل / بطاقة ضيقة: الدائرة فوق + قائمة تحت
 * شاشات أوسع: عمودان (دائرة + أسطورة) مع عرض كافٍ للأسماء الكاملة
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
        // دائماً عمودي داخل البطاقة الضيقة؛ جنباً إلى جنب فقط عند اتساع كافٍ
        "flex h-full min-h-0 flex-col items-stretch gap-5",
        "lg:flex-row lg:items-center lg:gap-5",
        className,
      )}
    >
      {/* الدائرة — بدون labels على القطاعات */}
      <div className="relative mx-auto h-52 w-full max-w-[200px] shrink-0 sm:h-56 sm:max-w-[220px] lg:mx-0 lg:w-[200px] lg:max-w-none">
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

        {/* مركز الدائرة */}
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

      {/*
        الأسطورة — تحت الدائرة على الشاشات الضيقة
        أسماء كاملة بدون truncate / line-clamp / max-width
      */}
      <ul
        className={cn(
          "grid w-full flex-1 gap-2.5",
          // صفّان على الشاشات المتوسطة عند التكديس العمودي
          "grid-cols-1 sm:grid-cols-2",
          // عمود واحد بجانب الدائرة لإعطاء كل اسم مساحة كاملة
          "lg:grid-cols-1 lg:min-w-[9.5rem]",
        )}
      >
        {data.map((item) => (
          <li
            key={item.name}
            className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-muted/20 px-3 py-2.5"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="flex-1 text-sm font-medium leading-snug text-card-foreground">
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
