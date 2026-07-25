/** Course catalog for photography training center */

export const COURSE_STATUSES = [
  "draft",
  "open",
  "full",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_CATEGORIES = [
  "basics",
  "portrait",
  "landscape",
  "studio",
  "product",
  "wedding",
  "video",
  "editing",
  "other",
] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

/** Reuse same level ladder as students */
export const COURSE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "professional",
] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export type Course = {
  id: string;
  organizationId: string;
  /** e.g. CRS-0012 */
  code: string;
  title: string;
  description?: string;
  category: CourseCategory;
  level: CourseLevel;
  status: CourseStatus;
  /** Tuition price in SAR */
  price: number;
  durationHours: number;
  sessionsCount: number;
  maxSeats: number;
  instructorName?: string;
  startDate?: string;
  endDate?: string;
  /** Free-text schedule note, e.g. "أحد وثلاثاء 6م" */
  scheduleNote?: string;
  /** Denormalized active enrollments */
  enrolledCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CourseInput = {
  title: string;
  description?: string;
  category: CourseCategory;
  level: CourseLevel;
  status: CourseStatus;
  price: number;
  durationHours: number;
  sessionsCount: number;
  maxSeats: number;
  instructorName?: string;
  startDate?: string;
  endDate?: string;
  scheduleNote?: string;
};

export type CourseFilters = {
  query?: string;
  status?: CourseStatus | "all";
  level?: CourseLevel | "all";
  category?: CourseCategory | "all";
};

export type CourseStats = {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  totalSeats: number;
  filledSeats: number;
};

export const ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "completed",
  "dropped",
  "refunded",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export type Enrollment = {
  id: string;
  organizationId: string;
  courseId: string;
  studentId: string;
  status: EnrollmentStatus;
  priceAgreed: number;
  amountPaid: number;
  enrolledAt: string;
  completedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type EnrollmentInput = {
  courseId: string;
  studentId: string;
  status?: EnrollmentStatus;
  priceAgreed?: number;
  notes?: string;
};

/** Joined row for UI tables */
export type EnrollmentWithDetails = Enrollment & {
  studentName: string;
  studentCode: string;
  studentPhone: string;
  courseTitle: string;
  courseCode: string;
};
