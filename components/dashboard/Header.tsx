"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Languages,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";
import { notifications } from "@/data/dashboard";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n/translations";

type HeaderProps = {
  user: AuthUser;
  title?: string;
  subtitle?: string;
};

const routeMeta: Array<{
  prefix: string;
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
}> = [
  { prefix: "/students", titleKey: "students", subtitleKey: "studentsSubtitle" },
  { prefix: "/dashboard", titleKey: "dashboard", subtitleKey: "overviewSubtitle" },
  { prefix: "/analytics", titleKey: "analytics" },
  { prefix: "/customers", titleKey: "customers" },
  { prefix: "/reports", titleKey: "reports" },
  { prefix: "/billing", titleKey: "billing" },
  { prefix: "/settings", titleKey: "settings" },
];

export function Header({ user, title, subtitle }: HeaderProps) {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, locale, toggleLocale } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);

  const unread = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [],
  );

  const matched = routeMeta.find(
    (item) =>
      pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );

  const pageTitle = title ?? (matched ? t(matched.titleKey) : t("dashboard"));
  const pageSubtitle =
    subtitle ??
    (matched?.subtitleKey ? t(matched.subtitleKey) : t("overviewSubtitle"));

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  const ThemeIcon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Sun : Moon;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="rounded-xl border border-border bg-card p-2.5 text-foreground shadow-sm lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                {pageTitle}
              </h1>
              <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
                {pageSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative hidden md:block">
              <Search className="pointer-events-none absolute top-1/2 end-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                className="h-10 w-56 rounded-xl border border-border bg-card pe-3 ps-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium shadow-sm transition hover:border-primary/30"
            >
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">
                {locale === "ar" ? "٢٤ يوليو – ٢٤ أغسطس" : "Jul 24 – Aug 24"}
              </span>
              <span className="sm:hidden">{t("period")}</span>
            </button>

            <button
              type="button"
              onClick={toggleLocale}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium shadow-sm transition hover:border-primary/30"
              aria-label={t("language")}
              title={t("language")}
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">
                {locale === "ar" ? t("english") : t("arabic")}
              </span>
            </button>

            <button
              type="button"
              onClick={cycleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/30"
              aria-label={t("theme")}
              title={`${t("theme")}: ${theme}`}
            >
              <ThemeIcon className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((v) => !v)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/30"
                aria-label={t("notifications")}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                  <span className="absolute top-1.5 start-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </button>

              {showNotifications ? (
                <div className="absolute end-0 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-bold">{t("notifications")}</p>
                  </div>
                  <ul className="max-h-80 overflow-y-auto p-2">
                    {notifications.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "rounded-xl px-3 py-2.5 transition hover:bg-muted/60",
                          item.unread && "bg-primary/[0.04]",
                        )}
                      >
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {item.time}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/30"
              aria-label={t("messages")}
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card pe-3 ps-1.5 py-1.5 shadow-sm transition hover:border-primary/30"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {user.avatarInitials}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">
                {user.fullName.split(" ")[0]}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
