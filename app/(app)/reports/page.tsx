import type { Metadata } from "next";
import { ReportsModule } from "@/components/reports/reports-module";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "التقارير",
};

export default async function ReportsPage() {
  const user = await requirePermission("reports:view");
  const reports = await db.getReports(user.organizationId);

  return (
    <ReportsModule
      initialReports={reports}
      canCreate={hasPermission(user.role, "reports:export")}
      canDelete={hasPermission(user.role, "reports:export")}
    />
  );
}
