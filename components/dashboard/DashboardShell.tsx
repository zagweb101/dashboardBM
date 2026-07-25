import type { ReactNode } from "react";
import type { AuthUser } from "@/types/auth";
import type { NavBadges } from "@/types/dashboard";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/providers/sidebar-provider";

type DashboardShellProps = {
  children: ReactNode;
  user: AuthUser;
  title?: string;
  subtitle?: string;
  /** أعداد الشارات من السيرفر (مثل عدد المتدربين) */
  navBadges?: NavBadges;
};

export function DashboardShell({
  children,
  user,
  title,
  subtitle,
  navBadges,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar user={user} navBadges={navBadges} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header user={user} title={title} subtitle={subtitle} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px] animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
