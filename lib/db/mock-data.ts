import type {
  AnalyticsPoint,
  DatabaseSchema,
  Organization,
  Profile,
} from "@/types/database";
import type { Customer } from "@/types/customer";
import type { Report } from "@/types/report";
import type { Invoice, OrganizationSubscription } from "@/types/billing";
import { mockStudents as seededStudents } from "@/data/students";
import {
  mockAttendance as seededAttendance,
  mockCourses as seededCourses,
  mockEnrollments as seededEnrollments,
  mockStudentPayments as seededPayments,
} from "@/data/courses";
import type { Student } from "@/types/student";
import type { Course, Enrollment } from "@/types/course";
import type { AttendanceRecord } from "@/types/attendance";
import type { StudentPayment } from "@/types/payment";

export const MOCK_ORG_ID = "org_demo_001";

export const mockOrganizations: Organization[] = [
  {
    id: MOCK_ORG_ID,
    name: "بيت المصور",
    slug: "bayt-al-musawir",
    ownerId: "user_owner_001",
    createdAt: "2025-01-12T10:00:00.000Z",
  },
];

/** Mutable in-memory store for CRUD during the session */
export const mockStudents: Student[] = [...seededStudents];
export const mockCourses: Course[] = [...seededCourses];
export const mockEnrollments: Enrollment[] = [...seededEnrollments];
export const mockAttendance: AttendanceRecord[] = [...seededAttendance];
export const mockStudentPayments: StudentPayment[] = [...seededPayments];

export const mockProfiles: Profile[] = [
  {
    id: "user_owner_001",
    email: "owner@example.com",
    fullName: "أحمد المنصوري",
    role: "owner",
    organizationId: MOCK_ORG_ID,
    locale: "ar",
    createdAt: "2025-01-12T10:00:00.000Z",
  },
  {
    id: "user_admin_001",
    email: "admin@example.com",
    fullName: "سارة العتيبي",
    role: "admin",
    organizationId: MOCK_ORG_ID,
    locale: "ar",
    createdAt: "2025-02-01T09:00:00.000Z",
  },
  {
    id: "user_manager_001",
    email: "manager@example.com",
    fullName: "خالد الحربي",
    role: "manager",
    organizationId: MOCK_ORG_ID,
    locale: "en",
    createdAt: "2025-03-04T11:30:00.000Z",
  },
  {
    id: "user_employee_001",
    email: "employee@example.com",
    fullName: "نورة الشمري",
    role: "employee",
    organizationId: MOCK_ORG_ID,
    locale: "ar",
    createdAt: "2025-04-18T08:15:00.000Z",
  },
  {
    id: "user_viewer_001",
    email: "viewer@example.com",
    fullName: "Faisal Alotaibi",
    role: "viewer",
    organizationId: MOCK_ORG_ID,
    locale: "en",
    createdAt: "2025-05-22T14:00:00.000Z",
  },
];

/** Password for every mock user in demo mode */
export const MOCK_PASSWORD = "password123";

/** كلمات مرور mock قابلة للتغيير من /settings */
export const mockPasswordStore: Record<string, string> = {
  "user_owner_001": MOCK_PASSWORD,
  "user_admin_001": MOCK_PASSWORD,
  "user_manager_001": MOCK_PASSWORD,
  "user_employee_001": MOCK_PASSWORD,
  "user_viewer_001": MOCK_PASSWORD,
};

export const mockCustomers: Customer[] = [
  {
    id: "cust_1",
    organizationId: MOCK_ORG_ID,
    name: "محمد العلي",
    email: "mohammed@acme.sa",
    phone: "0501112233",
    company: "Acme KSA",
    status: "active",
    notes: "شريك تصوير فعاليات",
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-07-23T09:00:00.000Z",
  },
  {
    id: "cust_2",
    organizationId: MOCK_ORG_ID,
    name: "لمى الدوسري",
    email: "lama@nova.io",
    phone: "0552223344",
    company: "Nova Labs",
    status: "lead",
    notes: "مهتمة بدورات المنتجات",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-22T18:20:00.000Z",
  },
  {
    id: "cust_3",
    organizationId: MOCK_ORG_ID,
    name: "يوسف الزهراني",
    email: "yousef@orbit.com",
    phone: "0533334455",
    company: "Orbit Soft",
    status: "active",
    createdAt: "2025-11-03T00:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z",
  },
  {
    id: "cust_4",
    organizationId: MOCK_ORG_ID,
    name: "رهف السبيعي",
    email: "rahaf@bloom.co",
    phone: "0544445566",
    company: "Bloom Co",
    status: "inactive",
    notes: "توقف التعاون مؤقتاً",
    createdAt: "2025-08-19T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
  },
  {
    id: "cust_5",
    organizationId: MOCK_ORG_ID,
    name: "Abdullah Mutairi",
    email: "abdullah@pixel.dev",
    phone: "0566667788",
    company: "Pixel Dev",
    status: "lead",
    notes: "Follow up on corporate package",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "cust_6",
    organizationId: MOCK_ORG_ID,
    name: "نورة القحطاني",
    email: "noura@studio.sa",
    phone: "0577778899",
    company: "Studio N",
    status: "active",
    notes: "تعاقد دورات موظفين",
    createdAt: "2026-03-15T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
  },
  {
    id: "cust_7",
    organizationId: MOCK_ORG_ID,
    name: "خالد الفهد",
    email: "khaled@events.sa",
    phone: "0588889900",
    company: "Events Co",
    status: "lead",
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
  },
];

export const mockSubscriptions: OrganizationSubscription[] = [
  {
    id: "sub_1",
    organizationId: MOCK_ORG_ID,
    planId: "pro",
    status: "active",
    interval: "month",
    currentPeriodEnd: "2026-08-24T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    stripeCustomerId: "cus_mock_pro",
    stripeSubscriptionId: "sub_mock_pro",
  },
];

export const mockReports: Report[] = [
  {
    id: "rep_1",
    organizationId: MOCK_ORG_ID,
    title: "ملخص إيرادات الدورات — يوليو",
    type: "financial",
    filters: { month: "2026-07", currency: "SAR" },
    createdBy: "user_owner_001",
    createdByName: "أحمد المنصوري",
    createdAt: "2026-07-20T08:00:00.000Z",
  },
  {
    id: "rep_2",
    organizationId: MOCK_ORG_ID,
    title: "حضور أساسيات التصوير",
    type: "attendance",
    filters: { courseId: "crs_001", from: "2026-06-15", to: "2026-07-27" },
    createdBy: "user_manager_001",
    createdByName: "خالد الحربي",
    createdAt: "2026-07-18T11:30:00.000Z",
  },
  {
    id: "rep_3",
    organizationId: MOCK_ORG_ID,
    title: "مبيعات التسجيلات — الربع الثاني",
    type: "sales",
    filters: { quarter: "2026-Q2" },
    createdBy: "user_admin_001",
    createdByName: "سارة العتيبي",
    createdAt: "2026-07-22T16:00:00.000Z",
  },
  {
    id: "rep_4",
    organizationId: MOCK_ORG_ID,
    title: "تقرير مخصص — مصادر التسجيل",
    type: "custom",
    filters: { dimension: "source" },
    createdBy: "user_owner_001",
    createdByName: "أحمد المنصوري",
    createdAt: "2026-07-15T10:00:00.000Z",
  },
];

export const mockAnalytics: AnalyticsPoint[] = [
  { label: "Jan", revenue: 42000, customers: 120, churn: 2.1 },
  { label: "Feb", revenue: 38000, customers: 132, churn: 2.4 },
  { label: "Mar", revenue: 51000, customers: 151, churn: 1.9 },
  { label: "Apr", revenue: 47000, customers: 168, churn: 2.0 },
  { label: "May", revenue: 61000, customers: 190, churn: 1.6 },
  { label: "Jun", revenue: 58000, customers: 205, churn: 1.8 },
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv_1",
    number: "INV-2026-014",
    amount: 1199,
    currency: "SAR",
    status: "paid",
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "inv_2",
    number: "INV-2026-013",
    amount: 1199,
    currency: "SAR",
    status: "paid",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "inv_3",
    number: "INV-2026-012",
    amount: 1199,
    currency: "SAR",
    status: "open",
    createdAt: "2026-05-01T00:00:00.000Z",
  },
];

export const mockDb = {
  organizations: mockOrganizations,
  profiles: mockProfiles,
  customers: mockCustomers,
  students: mockStudents,
  courses: mockCourses,
  enrollments: mockEnrollments,
  attendance: mockAttendance,
  studentPayments: mockStudentPayments,
  subscriptions: mockSubscriptions,
  reports: mockReports,
  analytics: mockAnalytics,
} satisfies DatabaseSchema & {
  courses: Course[];
  enrollments: Enrollment[];
  attendance: AttendanceRecord[];
  studentPayments: StudentPayment[];
};
