/**
 * مستودع Mock (ذاكرة) — التطوير المحلي بدون Postgres
 * يحافظ على نفس واجهة db المستخدمة في الصفحات والـ Server Actions
 */
import {
  mockAnalytics,
  mockCustomers,
  mockDb,
  mockInvoices,
  mockOrganizations,
  mockProfiles,
  mockReports,
  mockStudents,
  mockSubscriptions,
  mockPasswordStore as passwordStore,
  MOCK_PASSWORD,
} from "@/lib/db/mock-data";
import { mockTrainingDb } from "@/lib/db/training";
import type {
  AuthSessionRow,
  Profile,
  ProfileUpdateInput,
  TeamInviteInput,
} from "@/types/database";
import type {
  Customer,
  CustomerFilters,
  CustomerInput,
  CustomerStats,
} from "@/types/customer";
import type { Report, ReportInput } from "@/types/report";
import type { Invoice, OrganizationSubscription } from "@/types/billing";
import type {
  Student,
  StudentFilters,
  StudentInput,
  StudentSort,
  StudentStats,
} from "@/types/student";
import type { Role } from "@/types/rbac";
import { sleep } from "@/lib/utils";
function nextStudentCode(): string {
  const max = mockStudents.reduce((acc, s) => {
    const n = Number(s.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 10000);
  return `STU-${String(max + 1).padStart(5, "0")}`;
}

function matchesFilters(student: Student, filters?: StudentFilters): boolean {
  if (!filters) return true;

  if (filters.query) {
    const q = filters.query.trim().toLowerCase();
    const hay = [
      student.fullName,
      student.email,
      student.phone,
      student.code,
      student.city,
      student.nationalId ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (filters.status && filters.status !== "all" && student.status !== filters.status) {
    return false;
  }
  if (filters.level && filters.level !== "all" && student.level !== filters.level) {
    return false;
  }
  if (filters.source && filters.source !== "all" && student.source !== filters.source) {
    return false;
  }
  if (filters.gender && filters.gender !== "all" && student.gender !== filters.gender) {
    return false;
  }
  if (filters.city && filters.city !== "all" && student.city !== filters.city) {
    return false;
  }

  return true;
}

function sortStudents(list: Student[], sort?: StudentSort): Student[] {
  if (!sort) {
    return [...list].sort(
      (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
    );
  }

  const dir = sort.direction === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];

    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }

    const as = String(av ?? "");
    const bs = String(bv ?? "");

    if (sort.key === "joinedAt") {
      return (new Date(as).getTime() - new Date(bs).getTime()) * dir;
    }

    return as.localeCompare(bs, "ar") * dir;
  });
}

export const mockRepository = {
  ...mockTrainingDb,

  async getProfileByEmail(email: string): Promise<Profile | null> {
    await sleep(40);
    const normalized = email.trim().toLowerCase();
    return (
      mockProfiles.find((p) => p.email.toLowerCase() === normalized) ?? null
    );
  },

  async getProfileById(id: string): Promise<Profile | null> {
    await sleep(20);
    return mockProfiles.find((p) => p.id === id) ?? null;
  },

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<Profile | null> {
    await sleep(80);
    const profile = await this.getProfileByEmail(email);
    if (!profile) return null;
    const stored = passwordStore[profile.id] ?? MOCK_PASSWORD;
    if (password !== stored) return null;
    return profile;
  },

  async updateProfile(
    userId: string,
    input: ProfileUpdateInput,
  ): Promise<Profile | null> {
    await sleep(60);
    const index = mockProfiles.findIndex((p) => p.id === userId);
    if (index < 0) return null;

    if (input.email) {
      const dup = mockProfiles.find(
        (p) =>
          p.id !== userId &&
          p.email.toLowerCase() === input.email!.toLowerCase(),
      );
      if (dup) throw new Error("EMAIL_EXISTS");
    }

    const current = mockProfiles[index];
    const updated: Profile = {
      ...current,
      fullName: input.fullName,
      email: input.email?.toLowerCase() ?? current.email,
      phone: input.phone !== undefined ? input.phone : current.phone,
      avatarUrl:
        input.avatarUrl !== undefined ? input.avatarUrl : current.avatarUrl,
      locale: input.locale ?? current.locale,
      theme: input.theme ?? current.theme ?? "system",
      updatedAt: new Date().toISOString(),
    };
    mockProfiles[index] = updated;
    return updated;
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    await sleep(80);
    const stored = passwordStore[userId] ?? MOCK_PASSWORD;
    if (currentPassword !== stored) throw new Error("INVALID_PASSWORD");
    if (newPassword.length < 8) throw new Error("WEAK_PASSWORD");
    passwordStore[userId] = newPassword;
    return true;
  },

  async inviteTeamMember(
    organizationId: string,
    input: TeamInviteInput,
  ): Promise<Profile> {
    await sleep(80);
    const email = input.email.trim().toLowerCase();
    if (mockProfiles.some((p) => p.email.toLowerCase() === email)) {
      throw new Error("EMAIL_EXISTS");
    }
    if (input.role === "owner") {
      // فقط إنشاء owner عبر مسار خاص — نرفض هنا
      throw new Error("CANNOT_ASSIGN_OWNER");
    }
    const id = `user_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const profile: Profile = {
      id,
      email,
      fullName: input.fullName.trim(),
      role: input.role,
      organizationId,
      locale: "ar",
      theme: "system",
      phone: undefined,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    mockProfiles.push(profile);
    passwordStore[id] = input.temporaryPassword ?? MOCK_PASSWORD;
    return profile;
  },

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    role: Role,
    actorId: string,
  ): Promise<Profile | null> {
    await sleep(60);
    const member = mockProfiles.find(
      (p) => p.id === memberId && p.organizationId === organizationId,
    );
    if (!member) return null;

    if (member.id === actorId && role !== member.role) {
      // السماح بتغيير دور النفس فقط لغير owner-downgrade rules في actions
    }

    if (member.role === "owner" && role !== "owner") {
      const owners = mockProfiles.filter(
        (p) => p.organizationId === organizationId && p.role === "owner",
      );
      if (owners.length <= 1) throw new Error("LAST_OWNER");
    }

    if (role === "owner") {
      const actor = mockProfiles.find((p) => p.id === actorId);
      if (actor?.role !== "owner") throw new Error("CANNOT_ASSIGN_OWNER");
    }

    member.role = role;
    member.updatedAt = new Date().toISOString();
    return member;
  },

  async removeTeamMember(
    organizationId: string,
    memberId: string,
    actorId: string,
  ): Promise<boolean> {
    await sleep(60);
    if (memberId === actorId) throw new Error("CANNOT_REMOVE_SELF");

    const index = mockProfiles.findIndex(
      (p) => p.id === memberId && p.organizationId === organizationId,
    );
    if (index < 0) return false;

    const member = mockProfiles[index];
    if (member.role === "owner") {
      const owners = mockProfiles.filter(
        (p) => p.organizationId === organizationId && p.role === "owner",
      );
      if (owners.length <= 1) throw new Error("LAST_OWNER");
    }

    mockProfiles.splice(index, 1);
    delete passwordStore[memberId];
    return true;
  },

  async listUserSessions(userId: string): Promise<AuthSessionRow[]> {
    await sleep(20);
    // mock: جلسة وهمية واحدة
    return [
      {
        id: `sess_mock_${userId}`,
        sessionToken: "mock-session-token",
        userId,
        expires: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      },
    ];
  },

  // ── Customers ────────────────────────────────────────────────────────

  async getCustomers(
    organizationId: string,
    filters?: CustomerFilters,
  ): Promise<Customer[]> {
    await sleep(50);
    let rows = mockCustomers.filter((c) => c.organizationId === organizationId);
    if (filters?.status && filters.status !== "all") {
      rows = rows.filter((c) => c.status === filters.status);
    }
    if (filters?.query?.trim()) {
      const q = filters.query.trim().toLowerCase();
      rows = rows.filter((c) =>
        [c.name, c.email, c.phone ?? "", c.company ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return rows.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  /** alias */
  async listCustomers(
    organizationId: string,
    filters?: CustomerFilters,
  ): Promise<Customer[]> {
    return this.getCustomers(organizationId, filters);
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    await sleep(20);
    return mockCustomers.find((c) => c.id === id) ?? null;
  },

  /** alias */
  async getCustomer(id: string): Promise<Customer | null> {
    return this.getCustomerById(id);
  },

  async getCustomerStats(organizationId: string): Promise<CustomerStats> {
    await sleep(30);
    const rows = mockCustomers.filter((c) => c.organizationId === organizationId);
    return {
      total: rows.length,
      active: rows.filter((c) => c.status === "active").length,
      inactive: rows.filter((c) => c.status === "inactive").length,
      lead: rows.filter((c) => c.status === "lead").length,
    };
  },

  async createCustomer(
    organizationId: string,
    input: CustomerInput,
  ): Promise<Customer> {
    await sleep(70);
    const now = new Date().toISOString();
    const customer: Customer = {
      id: `cust_${Date.now().toString(36)}`,
      organizationId,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      company: input.company,
      status: input.status,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    mockCustomers.unshift(customer);
    return customer;
  },

  async updateCustomer(
    id: string,
    input: CustomerInput,
  ): Promise<Customer | null> {
    await sleep(70);
    const index = mockCustomers.findIndex((c) => c.id === id);
    if (index < 0) return null;
    const updated: Customer = {
      ...mockCustomers[index],
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      company: input.company,
      status: input.status,
      notes: input.notes,
      updatedAt: new Date().toISOString(),
    };
    mockCustomers[index] = updated;
    return updated;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    await sleep(50);
    const index = mockCustomers.findIndex((c) => c.id === id);
    if (index < 0) return false;
    mockCustomers.splice(index, 1);
    return true;
  },

  // ── Reports ──────────────────────────────────────────────────────────

  async getReports(organizationId: string): Promise<Report[]> {
    await sleep(40);
    return mockReports
      .filter((r) => r.organizationId === organizationId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  /** alias — organizationId اختياري للتوافق مع الاستدعاءات القديمة */
  async listReports(organizationId?: string): Promise<Report[]> {
    if (organizationId) return this.getReports(organizationId);
    return [...mockReports].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getReportById(id: string): Promise<Report | null> {
    await sleep(20);
    return mockReports.find((r) => r.id === id) ?? null;
  },

  async createReport(
    organizationId: string,
    input: ReportInput,
    createdBy?: string,
  ): Promise<Report> {
    await sleep(70);
    const profile = createdBy
      ? mockProfiles.find((p) => p.id === createdBy)
      : null;
    const report: Report = {
      id: `rep_${Date.now().toString(36)}`,
      organizationId,
      title: input.title,
      type: input.type,
      filters: input.filters ?? {},
      createdBy: createdBy ?? null,
      createdByName: profile?.fullName ?? null,
      createdAt: new Date().toISOString(),
    };
    mockReports.unshift(report);
    return report;
  },

  async deleteReport(id: string): Promise<boolean> {
    await sleep(50);
    const index = mockReports.findIndex((r) => r.id === id);
    if (index < 0) return false;
    mockReports.splice(index, 1);
    return true;
  },

  async listStudents(
    organizationId: string,
    filters?: StudentFilters,
    sort?: StudentSort,
  ): Promise<Student[]> {
    await sleep(60);
    const filtered = mockStudents.filter(
      (s) => s.organizationId === organizationId && matchesFilters(s, filters),
    );
    return sortStudents(filtered, sort);
  },

  async getStudent(id: string): Promise<Student | null> {
    await sleep(30);
    return mockStudents.find((s) => s.id === id) ?? null;
  },

  async getStudentStats(organizationId: string): Promise<StudentStats> {
    await sleep(40);
    const rows = mockStudents.filter((s) => s.organizationId === organizationId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      total: rows.length,
      active: rows.filter((s) => s.status === "active").length,
      inactive: rows.filter((s) => s.status === "inactive").length,
      graduated: rows.filter((s) => s.status === "graduated").length,
      suspended: rows.filter((s) => s.status === "suspended").length,
      newThisMonth: rows.filter(
        (s) => new Date(s.joinedAt).getTime() >= monthStart,
      ).length,
    };
  },

  async createStudent(
    organizationId: string,
    input: StudentInput,
  ): Promise<Student> {
    await sleep(80);

    const duplicate = mockStudents.find(
      (s) =>
        s.organizationId === organizationId &&
        s.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (duplicate) {
      throw new Error("EMAIL_EXISTS");
    }

    const now = new Date().toISOString();
    const student: Student = {
      id: `stu_${Date.now().toString(36)}`,
      organizationId,
      code: nextStudentCode(),
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      nationalId: input.nationalId,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      city: input.city,
      address: input.address,
      status: input.status,
      level: input.level,
      source: input.source,
      notes: input.notes,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      enrolledCoursesCount: 0,
      totalPaid: 0,
      lastAttendanceAt: null,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    mockStudents.unshift(student);
    return student;
  },

  async updateStudent(
    id: string,
    input: StudentInput,
  ): Promise<Student | null> {
    await sleep(80);
    const index = mockStudents.findIndex((s) => s.id === id);
    if (index < 0) return null;

    const current = mockStudents[index];
    const duplicate = mockStudents.find(
      (s) =>
        s.id !== id &&
        s.organizationId === current.organizationId &&
        s.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (duplicate) {
      throw new Error("EMAIL_EXISTS");
    }

    const updated: Student = {
      ...current,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      nationalId: input.nationalId,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      city: input.city,
      address: input.address,
      status: input.status,
      level: input.level,
      source: input.source,
      notes: input.notes,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      updatedAt: new Date().toISOString(),
    };

    mockStudents[index] = updated;
    return updated;
  },

  async deleteStudent(id: string): Promise<boolean> {
    await sleep(60);
    const index = mockStudents.findIndex((s) => s.id === id);
    if (index < 0) return false;
    mockStudents.splice(index, 1);
    return true;
  },

  async listStudentCities(organizationId: string): Promise<string[]> {
    await sleep(20);
    const set = new Set(
      mockStudents
        .filter((s) => s.organizationId === organizationId)
        .map((s) => s.city)
        .filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  },

  async getAnalytics() {
    await sleep(30);
    return mockAnalytics;
  },

  async getSubscription(
    organizationId: string,
  ): Promise<OrganizationSubscription | null> {
    await sleep(20);
    return (
      mockSubscriptions.find((s) => s.organizationId === organizationId) ?? null
    );
  },

  async listInvoices(): Promise<Invoice[]> {
    await sleep(30);
    return mockInvoices;
  },

  async getOrganization(id: string) {
    await sleep(20);
    return mockOrganizations.find((o) => o.id === id) ?? null;
  },

  async listProfiles(organizationId: string): Promise<Profile[]> {
    await sleep(30);
    return mockProfiles.filter((p) => p.organizationId === organizationId);
  },

  snapshot() {
    return mockDb;
  },
};

export type AppRepository = typeof mockRepository;
