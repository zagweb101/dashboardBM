export const STUDENT_STATUSES = [
  "active",
  "inactive",
  "graduated",
  "suspended",
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_GENDERS = ["male", "female"] as const;
export type StudentGender = (typeof STUDENT_GENDERS)[number];

export const STUDENT_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "professional",
] as const;
export type StudentLevel = (typeof STUDENT_LEVELS)[number];

export const STUDENT_SOURCES = [
  "walk_in",
  "instagram",
  "snapchat",
  "tiktok",
  "referral",
  "website",
  "other",
] as const;
export type StudentSource = (typeof STUDENT_SOURCES)[number];

export type Student = {
  id: string;
  organizationId: string;
  /** Student code e.g. STU-00124 */
  code: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId?: string;
  gender: StudentGender;
  dateOfBirth?: string;
  city: string;
  address?: string;
  status: StudentStatus;
  level: StudentLevel;
  source: StudentSource;
  notes?: string;
  avatarUrl?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  enrolledCoursesCount: number;
  totalPaid: number;
  lastAttendanceAt?: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentInput = {
  fullName: string;
  email: string;
  phone: string;
  nationalId?: string;
  gender: StudentGender;
  dateOfBirth?: string;
  city: string;
  address?: string;
  status: StudentStatus;
  level: StudentLevel;
  source: StudentSource;
  notes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

export type StudentFilters = {
  query?: string;
  status?: StudentStatus | "all";
  level?: StudentLevel | "all";
  source?: StudentSource | "all";
  gender?: StudentGender | "all";
  city?: string | "all";
};

export type StudentSortKey =
  | "fullName"
  | "joinedAt"
  | "status"
  | "level"
  | "totalPaid"
  | "enrolledCoursesCount";

export type StudentSort = {
  key: StudentSortKey;
  direction: "asc" | "desc";
};

export type StudentStats = {
  total: number;
  active: number;
  inactive: number;
  graduated: number;
  suspended: number;
  newThisMonth: number;
};
