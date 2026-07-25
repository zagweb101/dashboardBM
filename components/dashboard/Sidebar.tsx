"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones, X } from "lucide-react";
import type { AuthUser } from "@/types/auth";
import type { NavBadges } from "@/types/dashboard";
import { navItems } from "@/data/dashboard";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { cn, formatNumber } from "@/lib/utils";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRoleLabel } from "@/lib/rbac/roles";
import { logoutAction } from "@/lib/auth/actions";
import type { TranslationKey } from "@/lib/i18n/translations";

const labelKeys: Record<string, TranslationKey> = {
  "/dashboard": "dashboard",
  "/students": "students",
  "/courses": "coursesNav",
  "/attendance": "attendanceNav",
  "/payments": "paymentsNav",
  "/analytics": "analytics",
  "/customers": "customers",
  "/reports": "reports",
  "/billing": "billing",
  "/settings": "settings",
};

type SidebarProps = {
  user: AuthUser;
  navBadges?: NavBadges;
};

export function Sidebar({ user, navBadges }: SidebarProps) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const { t, locale, dir } = useLanguage();

  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(user.role, item.permission),
  );

  const edgeClass =
    dir === "rtl"
      ? open
        ? "translate-x-0"
        : "translate-x-full lg:translate-x-0"
      : open
        ? "translate-x-0"
        : "-translate-x-full lg:translate-x-0";

  const positionClass =
    dir === "rtl" ? "right-0 border-l" : "left-0 border-r";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-[280px] flex-col border-border bg-sidebar text-sidebar-foreground shadow-[var(--shadow-soft)] transition-transform duration-300 ease-out lg:static lg:z-0 lg:translate-x-0",
          positionClass,
          edgeClass,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground shadow-sm">
              ب
            </div>
            <div>
              <p className="text-base font-extrabold leading-none">
                {t("appName")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("appTagline")}
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 transition hover:border-primary/20">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                user.avatarInitials
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {getRoleLabel(user.role, locale)} · {user.organizationName}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground">
            {t("mainMenu")}
          </p>
          {visibleItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const label = labelKeys[item.href]
              ? t(labelKeys[item.href])
              : item.label;

            // شارة ديناميكية من الـ layout (أو ثابتة من navItems)
            const dynamicCount = navBadges?.[item.href];
            const badge =
              dynamicCount !== undefined && dynamicCount > 0
                ? formatNumber(dynamicCount, locale)
                : item.badge
                  ? String(item.badge)
                  : null;

            // لا تعرض الشارة إن كانت ديناميكية وصفر
            const showBadge =
              badge !== null &&
              !(dynamicCount !== undefined && dynamicCount <= 0);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-muted hover:translate-x-0",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate">{label}</span>
                </span>
                {showBadge ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums transition",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary group-hover:bg-primary/15",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-border p-4">
          <div className="rounded-2xl border border-border bg-gradient-to-bl from-primary/10 via-card to-card p-4 transition hover:border-primary/25">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Headphones className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold">{t("needHelp")}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("supportCopy")}
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
            >
              {t("contactSupport")}
            </button>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.99]"
            >
              {t("logout")}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
