import type { Metadata } from "next";
import { PaymentsModule } from "@/components/payments/payments-module";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "مدفوعات المتدربين | بيت المصور",
};

export default async function PaymentsPage() {
  const user = await requirePermission("payments:view");

  const [payments, stats, students, courses] = await Promise.all([
    db.listStudentPayments(user.organizationId),
    db.getPaymentStats(user.organizationId),
    db.listStudents(user.organizationId),
    db.listCourses(user.organizationId),
  ]);

  return (
    <PaymentsModule
      initialPayments={payments}
      stats={stats}
      students={students}
      courses={courses}
      canCreate={hasPermission(user.role, "payments:create")}
      canDelete={hasPermission(user.role, "payments:delete")}
    />
  );
}
