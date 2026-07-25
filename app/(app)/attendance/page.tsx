import type { Metadata } from "next";
import { AttendanceModule } from "@/components/attendance/attendance-module";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "الحضور | بيت المصور",
};

type PageProps = {
  searchParams: Promise<{ courseId?: string; date?: string }>;
};

export default async function AttendancePage({ searchParams }: PageProps) {
  const user = await requirePermission("attendance:view");
  const sp = await searchParams;

  const courses = await db.listCourses(user.organizationId);
  const activeCourses = courses.filter(
    (c) => c.status === "open" || c.status === "in_progress" || c.status === "full",
  );
  const pickList = activeCourses.length ? activeCourses : courses;

  const courseId = sp.courseId || pickList[0]?.id || "";
  const sessionDate =
    sp.date || new Date().toISOString().slice(0, 10);

  const [roster, recent, stats] = await Promise.all([
    courseId
      ? db.getAttendanceRoster(user.organizationId, courseId, sessionDate)
      : Promise.resolve([]),
    db.listAttendance(user.organizationId),
    db.getAttendanceStats(user.organizationId),
  ]);

  return (
    <AttendanceModule
      courses={pickList.length ? pickList : courses}
      recent={recent}
      stats={stats}
      initialRoster={roster}
      initialCourseId={courseId}
      initialSessionDate={sessionDate}
      canManage={hasPermission(user.role, "attendance:manage")}
    />
  );
}
