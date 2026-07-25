import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { NavBadges } from "@/types/dashboard";
import { hasPermission } from "@/lib/rbac/permissions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const navBadges: NavBadges = {};

  // شارة المتدربين الديناميكية
  if (hasPermission(user.role, "students:view")) {
    try {
      const stats = await db.getStudentStats(user.organizationId);
      if (stats.total > 0) {
        navBadges["/students"] = stats.total;
      }
    } catch {
      /* تجاهل فشل الإحصائيات — القائمة تبقى تعمل */
    }
  }

  return (
    <DashboardShell user={user} navBadges={navBadges}>
      {children}
    </DashboardShell>
  );
}
