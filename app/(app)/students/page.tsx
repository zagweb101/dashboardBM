import type { Metadata } from "next";
import { StudentsModule } from "@/components/students/students-module";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "المتدربون | بيت المصور",
};

export default async function StudentsPage() {
  const user = await requirePermission("students:view");

  const [students, stats, cities] = await Promise.all([
    db.listStudents(user.organizationId),
    db.getStudentStats(user.organizationId),
    db.listStudentCities(user.organizationId),
  ]);

  return (
    <StudentsModule
      initialStudents={students}
      stats={stats}
      cities={cities}
      canCreate={hasPermission(user.role, "students:create")}
      canEdit={hasPermission(user.role, "students:edit")}
      canDelete={hasPermission(user.role, "students:delete")}
    />
  );
}
