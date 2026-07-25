import type { Metadata } from "next";
import { CoursesModule } from "@/components/courses/courses-module";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "الدورات | بيت المصور",
};

export default async function CoursesPage() {
  const user = await requirePermission("courses:view");

  const [courses, stats] = await Promise.all([
    db.listCourses(user.organizationId),
    db.getCourseStats(user.organizationId),
  ]);

  return (
    <CoursesModule
      initialCourses={courses}
      stats={stats}
      canCreate={hasPermission(user.role, "courses:create")}
      canEdit={hasPermission(user.role, "courses:edit")}
      canDelete={hasPermission(user.role, "courses:delete")}
    />
  );
}
