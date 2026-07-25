"use client";

import {
  GraduationCap,
  PauseCircle,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { StudentStats } from "@/types/student";
import { StatCard } from "@/components/dashboard/StatCard";
import { useLanguage } from "@/components/providers/language-provider";
import { formatNumber } from "@/lib/utils";

type StudentsStatsProps = {
  stats: StudentStats;
};

export function StudentsStats({ stats }: StudentsStatsProps) {
  const { locale, t } = useLanguage();

  const cards = [
    {
      id: "total",
      title: t("totalStudents"),
      value: formatNumber(stats.total, locale),
      change: t("allTime"),
      trend: "neutral" as const,
      icon: <Users className="h-5 w-5" />,
      accent: "bg-primary/10 text-primary",
    },
    {
      id: "active",
      title: t("activeStudents"),
      value: formatNumber(stats.active, locale),
      change: `${formatNumber(stats.inactive, locale)} ${t("inactiveStudents").toLowerCase()}`,
      trend: "up" as const,
      icon: <UserCheck className="h-5 w-5" />,
      accent:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      id: "new",
      title: t("newThisMonth"),
      value: formatNumber(stats.newThisMonth, locale),
      change: t("vsPrevious"),
      trend: stats.newThisMonth > 0 ? ("up" as const) : ("neutral" as const),
      icon: <UserPlus className="h-5 w-5" />,
      accent: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
    },
    {
      id: "graduated",
      title: t("graduatedStudents"),
      value: formatNumber(stats.graduated, locale),
      change: `${formatNumber(stats.suspended, locale)} ${t("suspendedStudents").toLowerCase()}`,
      trend: "neutral" as const,
      icon:
        stats.suspended > 0 ? (
          <PauseCircle className="h-5 w-5" />
        ) : (
          <GraduationCap className="h-5 w-5" />
        ),
      accent:
        "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.id}
          title={card.title}
          value={card.value}
          change={card.change}
          trend={card.trend}
          icon={card.icon}
          accent={card.accent}
        />
      ))}
    </section>
  );
}
