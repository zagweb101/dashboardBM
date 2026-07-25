import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseDetail } from "@/components/courses/course-detail";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await db.getCourse(id);
  return {
    title: course
      ? `${course.title} | بيت المصور`
      : "دورة | بيت المصور",
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const user = await requirePermission("courses:view");
  const { id } = await params;
  const course = await db.getCourse(id);

  if (!course || course.organizationId !== user.organizationId) {
    notFound();
  }

  const [enrollments, students] = await Promise.all([
    db.listEnrollments(user.organizationId, { courseId: id }),
    db.listStudents(user.organizationId),
  ]);

  return (
    <CourseDetail
      course={course}
      enrollments={enrollments}
      students={students}
      canEdit={hasPermission(user.role, "courses:edit")}
    />
  );
}
