export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceRecord = {
  id: string;
  organizationId: string;
  courseId: string;
  studentId: string;
  enrollmentId?: string | null;
  /** YYYY-MM-DD (session calendar day) */
  sessionDate: string;
  sessionNumber?: number | null;
  status: AttendanceStatus;
  notes?: string;
  recordedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceInput = {
  courseId: string;
  studentId: string;
  enrollmentId?: string;
  sessionDate: string;
  sessionNumber?: number;
  status: AttendanceStatus;
  notes?: string;
};

export type AttendanceFilters = {
  courseId?: string | "all";
  studentId?: string | "all";
  sessionDate?: string;
  status?: AttendanceStatus | "all";
};

export type AttendanceWithDetails = AttendanceRecord & {
  studentName: string;
  studentCode: string;
  courseTitle: string;
};

export type AttendanceSessionRosterItem = {
  studentId: string;
  studentName: string;
  studentCode: string;
  enrollmentId: string;
  /** Existing record for this session, if any */
  record?: AttendanceRecord | null;
};

export type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalMarked: number;
  rate: number;
};
