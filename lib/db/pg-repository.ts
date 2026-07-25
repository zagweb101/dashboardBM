/**
 * مستودع PostgreSQL — نفس واجهة mock-repository
 * يُفعَّل تلقائياً عند DATABASE_URL
 *
 * جداول: organizations, profiles, students, courses, enrollments,
 *        attendance_records, student_payments, customers, reports
 *
 * analytics / billing invoices: تبقى mock حتى تُضاف جداولها
 */
import type { PoolClient } from "pg";
import {
  clientQuery,
  clientQueryOne,
  DatabaseError,
  query,
  queryOne,
  withTransaction,
} from "@/lib/db/postgres";
import {
  mapAttendance,
  mapCourse,
  mapCustomer,
  mapEnrollment,
  mapOrganization,
  mapPayment,
  mapProfile,
  mapReport,
  mapStudent,
} from "@/lib/db/mappers";
import {
  mockAnalytics,
  mockInvoices,
  mockSubscriptions,
  MOCK_PASSWORD,
} from "@/lib/db/mock-data";
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
import type { Role } from "@/types/rbac";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type {
  Student,
  StudentFilters,
  StudentInput,
  StudentSort,
  StudentStats,
} from "@/types/student";
import type {
  Course,
  CourseFilters,
  CourseInput,
  CourseStats,
  Enrollment,
  EnrollmentInput,
  EnrollmentStatus,
  EnrollmentWithDetails,
} from "@/types/course";
import type {
  AttendanceFilters,
  AttendanceInput,
  AttendanceRecord,
  AttendanceSessionRosterItem,
  AttendanceStats,
  AttendanceWithDetails,
} from "@/types/attendance";
import type {
  PaymentStats,
  StudentPayment,
  StudentPaymentFilters,
  StudentPaymentInput,
  StudentPaymentWithDetails,
} from "@/types/payment";

// ── Helpers ────────────────────────────────────────────────────────────

async function nextStudentCode(orgId: string, client?: PoolClient): Promise<string> {
  const sql = `
    SELECT code FROM students
    WHERE organization_id = $1
    ORDER BY code DESC
    LIMIT 1
  `;
  const row = client
    ? await clientQueryOne<{ code: string }>(client, sql, [orgId])
    : await queryOne<{ code: string }>(sql, [orgId]);
  const max = row ? Number(String(row.code).replace(/\D/g, "")) : 10000;
  const n = Number.isFinite(max) ? max + 1 : 10001;
  return `STU-${String(n).padStart(5, "0")}`;
}

async function nextCourseCode(orgId: string, client?: PoolClient): Promise<string> {
  const sql = `
    SELECT code FROM courses
    WHERE organization_id = $1
    ORDER BY code DESC
    LIMIT 1
  `;
  const row = client
    ? await clientQueryOne<{ code: string }>(client, sql, [orgId])
    : await queryOne<{ code: string }>(sql, [orgId]);
  const max = row ? Number(String(row.code).replace(/\D/g, "")) : 0;
  const n = Number.isFinite(max) ? max + 1 : 1;
  return `CRS-${String(n).padStart(4, "0")}`;
}

/** إعادة حساب إحصائيات المتدرب بعد تسجيل/دفعة/حضور */
async function recomputeStudentAggregates(
  studentId: string,
  client: PoolClient,
): Promise<void> {
  await clientQuery(
    client,
    `
    UPDATE students SET
      enrolled_courses_count = (
        SELECT COUNT(*)::int FROM enrollments
        WHERE student_id = $1 AND status IN ('active', 'completed')
      ),
      total_paid = (
        SELECT COALESCE(SUM(amount), 0) FROM student_payments
        WHERE student_id = $1 AND status = 'completed'
      ),
      last_attendance_at = (
        SELECT (session_date::text || 'T12:00:00.000Z')::timestamptz
        FROM attendance_records
        WHERE student_id = $1
        ORDER BY session_date DESC
        LIMIT 1
      ),
      updated_at = now()
    WHERE id = $1
    `,
    [studentId],
  );
}

async function recomputeEnrollmentPaid(
  enrollmentId: string,
  client: PoolClient,
): Promise<void> {
  await clientQuery(
    client,
    `
    UPDATE enrollments SET
      amount_paid = (
        SELECT COALESCE(SUM(amount), 0) FROM student_payments
        WHERE enrollment_id = $1 AND status = 'completed'
      ),
      updated_at = now()
    WHERE id = $1
    `,
    [enrollmentId],
  );
}

async function recomputeCourseEnrolled(
  courseId: string,
  client: PoolClient,
): Promise<void> {
  await clientQuery(
    client,
    `
    UPDATE courses c SET
      enrolled_count = (
        SELECT COUNT(*)::int FROM enrollments
        WHERE course_id = $1 AND status IN ('active', 'pending')
      ),
      status = CASE
        WHEN c.status = 'open' AND (
          SELECT COUNT(*) FROM enrollments
          WHERE course_id = $1 AND status IN ('active', 'pending')
        ) >= c.max_seats THEN 'full'
        WHEN c.status = 'full' AND (
          SELECT COUNT(*) FROM enrollments
          WHERE course_id = $1 AND status IN ('active', 'pending')
        ) < c.max_seats THEN 'open'
        ELSE c.status
      END,
      updated_at = now()
    WHERE id = $1
    `,
    [courseId],
  );
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof DatabaseError && err.code === "23505"
  ) ||
    (typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "23505");
}

// ── Repository ─────────────────────────────────────────────────────────

export const pgRepository = {
  // ── Auth / org (Postgres) ────────────────────────────────────────────

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const row = await queryOne(
      `SELECT * FROM profiles WHERE lower(email) = lower($1) LIMIT 1`,
      [email.trim()],
    );
    return row ? mapProfile(row) : null;
  },

  async getProfileById(id: string): Promise<Profile | null> {
    const row = await queryOne(`SELECT * FROM profiles WHERE id = $1`, [id]);
    return row ? mapProfile(row) : null;
  },

  /**
   * تحقق الدخول في وضع mock-auth + بيانات Postgres:
   * كلمة المرور التجريبية ثابتة (password123) ما لم تُربط Auth حقيقي.
   */
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<Profile | null> {
    if (password !== MOCK_PASSWORD) return null;
    return this.getProfileByEmail(email);
  },

  async getOrganization(id: string) {
    const row = await queryOne(`SELECT * FROM organizations WHERE id = $1`, [
      id,
    ]);
    return row ? mapOrganization(row) : null;
  },

  async listProfiles(organizationId: string): Promise<Profile[]> {
    const rows = await query(
      `SELECT * FROM profiles WHERE organization_id = $1 ORDER BY created_at`,
      [organizationId],
    );
    return rows.map(mapProfile);
  },

  async updateProfile(
    userId: string,
    input: ProfileUpdateInput,
  ): Promise<Profile | null> {
    return withTransaction(async (client) => {
      if (input.email) {
        const dup = await clientQueryOne(
          client,
          `SELECT id FROM profiles WHERE lower(email) = lower($1) AND id <> $2`,
          [input.email, userId],
        );
        if (dup) throw new Error("EMAIL_EXISTS");
      }

      // اقرأ الحالي لملء الحقول غير المُرسلة
      const current = await clientQueryOne(
        client,
        `SELECT * FROM profiles WHERE id = $1`,
        [userId],
      );
      if (!current) return null;
      const cur = mapProfile(current);

      const fullName = input.fullName;
      const email = (input.email ?? cur.email).toLowerCase();
      const phone = input.phone !== undefined ? input.phone || null : cur.phone ?? null;
      const avatar =
        input.avatarUrl !== undefined ? input.avatarUrl : cur.avatarUrl;
      const locale = input.locale ?? cur.locale;
      const theme = input.theme ?? cur.theme ?? "system";

      await clientQuery(
        client,
        `
        UPDATE users SET
          name = $2, email = $3, image = $4, phone = $5,
          locale = $6, theme = $7, updated_at = now()
        WHERE id = $1
        `,
        [userId, fullName, email, avatar, phone, locale, theme],
      );

      const rows = await clientQuery(
        client,
        `
        UPDATE profiles SET
          full_name = $2, email = $3, phone = $4, avatar_url = $5,
          locale = $6, theme = $7, updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [userId, fullName, email, phone, avatar, locale, theme],
      );
      return rows[0] ? mapProfile(rows[0]) : null;
    });
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const row = await queryOne<{ password_hash: string | null }>(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId],
    );
    if (!row) throw new Error("USER_NOT_FOUND");

    const ok = await verifyPassword(currentPassword, row.password_hash);
    if (!ok) throw new Error("INVALID_PASSWORD");
    if (newPassword.length < 8) throw new Error("WEAK_PASSWORD");

    const hash = await hashPassword(newPassword);
    await query(
      `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
      [userId, hash],
    );
    return true;
  },

  async inviteTeamMember(
    organizationId: string,
    input: TeamInviteInput,
  ): Promise<Profile> {
    if (input.role === "owner") throw new Error("CANNOT_ASSIGN_OWNER");

    const email = input.email.trim().toLowerCase();
    const existing = await queryOne(
      `SELECT id FROM users WHERE lower(email) = $1`,
      [email],
    );
    if (existing) throw new Error("EMAIL_EXISTS");

    const id = `user_${Date.now().toString(36)}`;
    const temp = input.temporaryPassword ?? "password123";
    const passwordHash = await hashPassword(temp);

    return withTransaction(async (client) => {
      await clientQuery(
        client,
        `
        INSERT INTO users (
          id, name, email, "emailVerified", password_hash,
          role, organization_id, locale, theme
        ) VALUES ($1,$2,$3,now(),$4,$5,$6,'ar','system')
        `,
        [id, input.fullName.trim(), email, passwordHash, input.role, organizationId],
      );
      const rows = await clientQuery(
        client,
        `
        INSERT INTO profiles (
          id, email, full_name, role, organization_id, locale, theme
        ) VALUES ($1,$2,$3,$4,$5,'ar','system')
        RETURNING *
        `,
        [id, email, input.fullName.trim(), input.role, organizationId],
      );
      await clientQuery(
        client,
        `
        INSERT INTO accounts (id, "userId", type, provider, "providerAccountId")
        VALUES ($1,$2,'credentials','credentials',$3)
        ON CONFLICT (provider, "providerAccountId") DO NOTHING
        `,
        [`acc_${id}`, id, email],
      );
      return mapProfile(rows[0]);
    });
  },

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    role: Role,
    actorId: string,
  ): Promise<Profile | null> {
    return withTransaction(async (client) => {
      const member = await clientQueryOne(
        client,
        `SELECT * FROM profiles WHERE id = $1 AND organization_id = $2`,
        [memberId, organizationId],
      );
      if (!member) return null;
      const mapped = mapProfile(member);

      if (mapped.role === "owner" && role !== "owner") {
        const owners = await clientQuery(
          client,
          `SELECT id FROM profiles WHERE organization_id = $1 AND role = 'owner'`,
          [organizationId],
        );
        if (owners.length <= 1) throw new Error("LAST_OWNER");
      }

      if (role === "owner") {
        const actor = await clientQueryOne(
          client,
          `SELECT role FROM profiles WHERE id = $1`,
          [actorId],
        );
        if (actor?.role !== "owner") throw new Error("CANNOT_ASSIGN_OWNER");
      }

      await clientQuery(
        client,
        `UPDATE users SET role = $2, updated_at = now() WHERE id = $1`,
        [memberId, role],
      );
      const rows = await clientQuery(
        client,
        `
        UPDATE profiles SET role = $2, updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [memberId, role],
      );
      return rows[0] ? mapProfile(rows[0]) : null;
    });
  },

  async removeTeamMember(
    organizationId: string,
    memberId: string,
    actorId: string,
  ): Promise<boolean> {
    if (memberId === actorId) throw new Error("CANNOT_REMOVE_SELF");

    return withTransaction(async (client) => {
      const member = await clientQueryOne(
        client,
        `SELECT * FROM profiles WHERE id = $1 AND organization_id = $2`,
        [memberId, organizationId],
      );
      if (!member) return false;
      const mapped = mapProfile(member);

      if (mapped.role === "owner") {
        const owners = await clientQuery(
          client,
          `SELECT id FROM profiles WHERE organization_id = $1 AND role = 'owner'`,
          [organizationId],
        );
        if (owners.length <= 1) throw new Error("LAST_OWNER");
      }

      // حذف المستخدم (profiles + accounts + sessions cascade)
      await clientQuery(client, `DELETE FROM users WHERE id = $1`, [memberId]);
      return true;
    });
  },

  async listUserSessions(userId: string): Promise<AuthSessionRow[]> {
    const rows = await query(
      `
      SELECT id, "sessionToken", "userId", expires
      FROM sessions
      WHERE "userId" = $1
      ORDER BY expires DESC
      `,
      [userId],
    );
    return rows.map((r) => ({
      id: String(r.id),
      sessionToken: String(r.sessionToken),
      userId: String(r.userId),
      expires:
        r.expires instanceof Date
          ? r.expires.toISOString()
          : String(r.expires),
    }));
  },

  // ── Customers ────────────────────────────────────────────────────────

  async getCustomers(
    organizationId: string,
    filters?: CustomerFilters,
  ): Promise<Customer[]> {
    const clauses = ["organization_id = $1"];
    const params: unknown[] = [organizationId];
    let i = 2;

    if (filters?.status && filters.status !== "all") {
      clauses.push(`status = $${i++}`);
      params.push(filters.status);
    }
    if (filters?.query?.trim()) {
      clauses.push(`(
        name ILIKE $${i} OR email ILIKE $${i}
        OR COALESCE(phone,'') ILIKE $${i}
        OR COALESCE(company,'') ILIKE $${i}
      )`);
      params.push(`%${filters.query.trim()}%`);
      i++;
    }

    const rows = await query(
      `SELECT * FROM customers WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`,
      params,
    );
    return rows.map(mapCustomer);
  },

  async listCustomers(
    organizationId: string,
    filters?: CustomerFilters,
  ): Promise<Customer[]> {
    return this.getCustomers(organizationId, filters);
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const row = await queryOne(`SELECT * FROM customers WHERE id = $1`, [id]);
    return row ? mapCustomer(row) : null;
  },

  async getCustomer(id: string): Promise<Customer | null> {
    return this.getCustomerById(id);
  },

  async getCustomerStats(organizationId: string): Promise<CustomerStats> {
    const row = await queryOne<{
      total: string;
      active: string;
      inactive: string;
      lead: string;
    }>(
      `
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'active')::text AS active,
        COUNT(*) FILTER (WHERE status = 'inactive')::text AS inactive,
        COUNT(*) FILTER (WHERE status = 'lead')::text AS lead
      FROM customers
      WHERE organization_id = $1
      `,
      [organizationId],
    );
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      inactive: Number(row?.inactive ?? 0),
      lead: Number(row?.lead ?? 0),
    };
  },

  async createCustomer(
    organizationId: string,
    input: CustomerInput,
  ): Promise<Customer> {
    const id = `cust_${Date.now().toString(36)}`;
    const rows = await query(
      `
      INSERT INTO customers (
        id, organization_id, name, email, phone, company, status, notes
      ) VALUES ($1,$2,$3,lower($4),$5,$6,$7,$8)
      RETURNING *
      `,
      [
        id,
        organizationId,
        input.name,
        input.email,
        input.phone ?? null,
        input.company ?? null,
        input.status,
        input.notes ?? null,
      ],
    );
    return mapCustomer(rows[0]);
  },

  async updateCustomer(
    id: string,
    input: CustomerInput,
  ): Promise<Customer | null> {
    const row = await queryOne(
      `
      UPDATE customers SET
        name = $2, email = lower($3), phone = $4, company = $5,
        status = $6, notes = $7, updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        input.name,
        input.email,
        input.phone ?? null,
        input.company ?? null,
        input.status,
        input.notes ?? null,
      ],
    );
    return row ? mapCustomer(row) : null;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const rows = await query(
      `DELETE FROM customers WHERE id = $1 RETURNING id`,
      [id],
    );
    return rows.length > 0;
  },

  // ── Reports ──────────────────────────────────────────────────────────

  async getReports(organizationId: string): Promise<Report[]> {
    const rows = await query(
      `
      SELECT r.*, u.name AS created_by_name, p.full_name
      FROM reports r
      LEFT JOIN users u ON u.id = r.created_by
      LEFT JOIN profiles p ON p.id = r.created_by
      WHERE r.organization_id = $1
      ORDER BY r.created_at DESC
      `,
      [organizationId],
    );
    return rows.map(mapReport);
  },

  async listReports(organizationId?: string): Promise<Report[]> {
    if (organizationId) return this.getReports(organizationId);
    const rows = await query(
      `
      SELECT r.*, u.name AS created_by_name, p.full_name
      FROM reports r
      LEFT JOIN users u ON u.id = r.created_by
      LEFT JOIN profiles p ON p.id = r.created_by
      ORDER BY r.created_at DESC
      `,
    );
    return rows.map(mapReport);
  },

  async getReportById(id: string): Promise<Report | null> {
    const row = await queryOne(
      `
      SELECT r.*, u.name AS created_by_name, p.full_name
      FROM reports r
      LEFT JOIN users u ON u.id = r.created_by
      LEFT JOIN profiles p ON p.id = r.created_by
      WHERE r.id = $1
      `,
      [id],
    );
    return row ? mapReport(row) : null;
  },

  async createReport(
    organizationId: string,
    input: ReportInput,
    createdBy?: string,
  ): Promise<Report> {
    const id = `rep_${Date.now().toString(36)}`;
    const rows = await query(
      `
      INSERT INTO reports (id, organization_id, title, type, filters, created_by)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      RETURNING *
      `,
      [
        id,
        organizationId,
        input.title,
        input.type,
        JSON.stringify(input.filters ?? {}),
        createdBy ?? null,
      ],
    );
    // re-fetch with names
    return (await this.getReportById(id)) ?? mapReport(rows[0]);
  },

  async deleteReport(id: string): Promise<boolean> {
    const rows = await query(
      `DELETE FROM reports WHERE id = $1 RETURNING id`,
      [id],
    );
    return rows.length > 0;
  },

  async getAnalytics() {
    return mockAnalytics;
  },

  async getSubscription(
    organizationId: string,
  ): Promise<OrganizationSubscription | null> {
    return (
      mockSubscriptions.find((s) => s.organizationId === organizationId) ?? null
    );
  },

  async listInvoices(): Promise<Invoice[]> {
    return mockInvoices;
  },

  // ── Students ─────────────────────────────────────────────────────────

  async listStudents(
    organizationId: string,
    filters?: StudentFilters,
    sort?: StudentSort,
  ): Promise<Student[]> {
    const clauses = ["organization_id = $1"];
    const params: unknown[] = [organizationId];
    let i = 2;

    if (filters?.query?.trim()) {
      clauses.push(`(
        full_name ILIKE $${i} OR email ILIKE $${i} OR phone ILIKE $${i}
        OR code ILIKE $${i} OR city ILIKE $${i} OR COALESCE(national_id,'') ILIKE $${i}
      )`);
      params.push(`%${filters.query.trim()}%`);
      i++;
    }
    if (filters?.status && filters.status !== "all") {
      clauses.push(`status = $${i++}`);
      params.push(filters.status);
    }
    if (filters?.level && filters.level !== "all") {
      clauses.push(`level = $${i++}`);
      params.push(filters.level);
    }
    if (filters?.source && filters.source !== "all") {
      clauses.push(`source = $${i++}`);
      params.push(filters.source);
    }
    if (filters?.gender && filters.gender !== "all") {
      clauses.push(`gender = $${i++}`);
      params.push(filters.gender);
    }
    if (filters?.city && filters.city !== "all") {
      clauses.push(`city = $${i++}`);
      params.push(filters.city);
    }

    const sortMap: Record<string, string> = {
      fullName: "full_name",
      joinedAt: "joined_at",
      status: "status",
      level: "level",
      totalPaid: "total_paid",
      enrolledCoursesCount: "enrolled_courses_count",
    };
    const col = sort ? sortMap[sort.key] ?? "joined_at" : "joined_at";
    const dir = sort?.direction === "asc" ? "ASC" : "DESC";

    const rows = await query(
      `SELECT * FROM students WHERE ${clauses.join(" AND ")} ORDER BY ${col} ${dir}`,
      params,
    );
    return rows.map(mapStudent);
  },

  async getStudent(id: string): Promise<Student | null> {
    const row = await queryOne(`SELECT * FROM students WHERE id = $1`, [id]);
    return row ? mapStudent(row) : null;
  },

  async getStudentStats(organizationId: string): Promise<StudentStats> {
    const row = await queryOne<{
      total: string;
      active: string;
      inactive: string;
      graduated: string;
      suspended: string;
      new_this_month: string;
    }>(
      `
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'active')::text AS active,
        COUNT(*) FILTER (WHERE status = 'inactive')::text AS inactive,
        COUNT(*) FILTER (WHERE status = 'graduated')::text AS graduated,
        COUNT(*) FILTER (WHERE status = 'suspended')::text AS suspended,
        COUNT(*) FILTER (WHERE joined_at >= date_trunc('month', now()))::text AS new_this_month
      FROM students
      WHERE organization_id = $1
      `,
      [organizationId],
    );

    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      inactive: Number(row?.inactive ?? 0),
      graduated: Number(row?.graduated ?? 0),
      suspended: Number(row?.suspended ?? 0),
      newThisMonth: Number(row?.new_this_month ?? 0),
    };
  },

  async createStudent(
    organizationId: string,
    input: StudentInput,
  ): Promise<Student> {
    try {
      return await withTransaction(async (client) => {
        const code = await nextStudentCode(organizationId, client);
        const id = `stu_${Date.now().toString(36)}`;
        const rows = await clientQuery(
          client,
          `
          INSERT INTO students (
            id, organization_id, code, full_name, email, phone, national_id,
            gender, date_of_birth, city, address, status, level, source, notes,
            emergency_contact_name, emergency_contact_phone
          ) VALUES (
            $1,$2,$3,$4,lower($5),$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
          )
          RETURNING *
          `,
          [
            id,
            organizationId,
            code,
            input.fullName,
            input.email,
            input.phone,
            input.nationalId ?? null,
            input.gender,
            input.dateOfBirth || null,
            input.city,
            input.address ?? null,
            input.status,
            input.level,
            input.source,
            input.notes ?? null,
            input.emergencyContactName ?? null,
            input.emergencyContactPhone ?? null,
          ],
        );
        return mapStudent(rows[0]);
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new Error("EMAIL_EXISTS");
      throw err;
    }
  },

  async updateStudent(
    id: string,
    input: StudentInput,
  ): Promise<Student | null> {
    try {
      const row = await queryOne(
        `
        UPDATE students SET
          full_name = $2,
          email = lower($3),
          phone = $4,
          national_id = $5,
          gender = $6,
          date_of_birth = $7,
          city = $8,
          address = $9,
          status = $10,
          level = $11,
          source = $12,
          notes = $13,
          emergency_contact_name = $14,
          emergency_contact_phone = $15,
          updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          input.fullName,
          input.email,
          input.phone,
          input.nationalId ?? null,
          input.gender,
          input.dateOfBirth || null,
          input.city,
          input.address ?? null,
          input.status,
          input.level,
          input.source,
          input.notes ?? null,
          input.emergencyContactName ?? null,
          input.emergencyContactPhone ?? null,
        ],
      );
      return row ? mapStudent(row) : null;
    } catch (err) {
      if (isUniqueViolation(err)) throw new Error("EMAIL_EXISTS");
      throw err;
    }
  },

  async deleteStudent(id: string): Promise<boolean> {
    const n = await query(
      `DELETE FROM students WHERE id = $1 RETURNING id`,
      [id],
    );
    return n.length > 0;
  },

  async listStudentCities(organizationId: string): Promise<string[]> {
    const rows = await query<{ city: string }>(
      `
      SELECT DISTINCT city FROM students
      WHERE organization_id = $1 AND city <> ''
      ORDER BY city
      `,
      [organizationId],
    );
    return rows.map((r) => r.city);
  },

  // ── Courses ──────────────────────────────────────────────────────────

  async listCourses(
    organizationId: string,
    filters?: CourseFilters,
  ): Promise<Course[]> {
    const clauses = ["organization_id = $1"];
    const params: unknown[] = [organizationId];
    let i = 2;

    if (filters?.query?.trim()) {
      clauses.push(`(
        title ILIKE $${i} OR code ILIKE $${i}
        OR COALESCE(instructor_name,'') ILIKE $${i}
      )`);
      params.push(`%${filters.query.trim()}%`);
      i++;
    }
    if (filters?.status && filters.status !== "all") {
      clauses.push(`status = $${i++}`);
      params.push(filters.status);
    }
    if (filters?.level && filters.level !== "all") {
      clauses.push(`level = $${i++}`);
      params.push(filters.level);
    }
    if (filters?.category && filters.category !== "all") {
      clauses.push(`category = $${i++}`);
      params.push(filters.category);
    }

    const rows = await query(
      `SELECT * FROM courses WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`,
      params,
    );
    return rows.map(mapCourse);
  },

  async getCourse(id: string): Promise<Course | null> {
    const row = await queryOne(`SELECT * FROM courses WHERE id = $1`, [id]);
    return row ? mapCourse(row) : null;
  },

  async getCourseStats(organizationId: string): Promise<CourseStats> {
    const row = await queryOne<{
      total: string;
      open: string;
      in_progress: string;
      completed: string;
      total_seats: string;
      filled_seats: string;
    }>(
      `
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'open')::text AS open,
        COUNT(*) FILTER (WHERE status = 'in_progress')::text AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
        COALESCE(SUM(max_seats), 0)::text AS total_seats,
        COALESCE(SUM(enrolled_count), 0)::text AS filled_seats
      FROM courses
      WHERE organization_id = $1
      `,
      [organizationId],
    );
    return {
      total: Number(row?.total ?? 0),
      open: Number(row?.open ?? 0),
      inProgress: Number(row?.in_progress ?? 0),
      completed: Number(row?.completed ?? 0),
      totalSeats: Number(row?.total_seats ?? 0),
      filledSeats: Number(row?.filled_seats ?? 0),
    };
  },

  async createCourse(
    organizationId: string,
    input: CourseInput,
  ): Promise<Course> {
    return withTransaction(async (client) => {
      const code = await nextCourseCode(organizationId, client);
      const id = `crs_${Date.now().toString(36)}`;
      const rows = await clientQuery(
        client,
        `
        INSERT INTO courses (
          id, organization_id, code, title, description, category, level, status,
          price, duration_hours, sessions_count, max_seats, instructor_name,
          start_date, end_date, schedule_note
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
        )
        RETURNING *
        `,
        [
          id,
          organizationId,
          code,
          input.title,
          input.description ?? null,
          input.category,
          input.level,
          input.status,
          input.price,
          input.durationHours,
          input.sessionsCount,
          input.maxSeats,
          input.instructorName ?? null,
          input.startDate || null,
          input.endDate || null,
          input.scheduleNote ?? null,
        ],
      );
      return mapCourse(rows[0]);
    });
  },

  async updateCourse(id: string, input: CourseInput): Promise<Course | null> {
    return withTransaction(async (client) => {
      const rows = await clientQuery(
        client,
        `
        UPDATE courses SET
          title = $2, description = $3, category = $4, level = $5, status = $6,
          price = $7, duration_hours = $8, sessions_count = $9, max_seats = $10,
          instructor_name = $11, start_date = $12, end_date = $13,
          schedule_note = $14, updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          input.title,
          input.description ?? null,
          input.category,
          input.level,
          input.status,
          input.price,
          input.durationHours,
          input.sessionsCount,
          input.maxSeats,
          input.instructorName ?? null,
          input.startDate || null,
          input.endDate || null,
          input.scheduleNote ?? null,
        ],
      );
      if (!rows[0]) return null;
      await recomputeCourseEnrolled(id, client);
      const refreshed = await clientQueryOne(client, `SELECT * FROM courses WHERE id = $1`, [id]);
      return refreshed ? mapCourse(refreshed) : mapCourse(rows[0]);
    });
  },

  async deleteCourse(id: string): Promise<boolean> {
    const active = await queryOne(
      `
      SELECT id FROM enrollments
      WHERE course_id = $1 AND status IN ('active', 'pending')
      LIMIT 1
      `,
      [id],
    );
    if (active) throw new Error("COURSE_HAS_ENROLLMENTS");

    const rows = await query(`DELETE FROM courses WHERE id = $1 RETURNING id`, [
      id,
    ]);
    return rows.length > 0;
  },

  // ── Enrollments ──────────────────────────────────────────────────────

  async listEnrollments(
    organizationId: string,
    opts?: { courseId?: string; studentId?: string },
  ): Promise<EnrollmentWithDetails[]> {
    const clauses = ["e.organization_id = $1"];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (opts?.courseId) {
      clauses.push(`e.course_id = $${i++}`);
      params.push(opts.courseId);
    }
    if (opts?.studentId) {
      clauses.push(`e.student_id = $${i++}`);
      params.push(opts.studentId);
    }

    const rows = await query(
      `
      SELECT e.*,
        s.full_name AS student_name,
        s.code AS student_code,
        s.phone AS student_phone,
        c.title AS course_title,
        c.code AS course_code
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY e.enrolled_at DESC
      `,
      params,
    );

    return rows.map((row) => ({
      ...mapEnrollment(row),
      studentName: String(row.student_name ?? "—"),
      studentCode: String(row.student_code ?? "—"),
      studentPhone: String(row.student_phone ?? "—"),
      courseTitle: String(row.course_title ?? "—"),
      courseCode: String(row.course_code ?? "—"),
    }));
  },

  async getEnrollment(id: string): Promise<Enrollment | null> {
    const row = await queryOne(`SELECT * FROM enrollments WHERE id = $1`, [id]);
    return row ? mapEnrollment(row) : null;
  },

  async createEnrollment(
    organizationId: string,
    input: EnrollmentInput,
  ): Promise<Enrollment> {
    return withTransaction(async (client) => {
      const course = await clientQueryOne(
        client,
        `SELECT * FROM courses WHERE id = $1 AND organization_id = $2`,
        [input.courseId, organizationId],
      );
      if (!course) throw new Error("COURSE_NOT_FOUND");

      const student = await clientQueryOne(
        client,
        `SELECT * FROM students WHERE id = $1 AND organization_id = $2`,
        [input.studentId, organizationId],
      );
      if (!student) throw new Error("STUDENT_NOT_FOUND");

      const dup = await clientQueryOne(
        client,
        `
        SELECT id FROM enrollments
        WHERE course_id = $1 AND student_id = $2
          AND status NOT IN ('dropped', 'refunded')
        LIMIT 1
        `,
        [input.courseId, input.studentId],
      );
      if (dup) throw new Error("ALREADY_ENROLLED");

      const mappedCourse = mapCourse(course);
      if (
        mappedCourse.enrolledCount >= mappedCourse.maxSeats &&
        mappedCourse.status !== "draft"
      ) {
        throw new Error("COURSE_FULL");
      }

      const status: EnrollmentStatus = input.status ?? "active";
      const price = input.priceAgreed ?? mappedCourse.price;
      const id = `enr_${Date.now().toString(36)}`;

      // إن وُجد تسجيل قديم (dropped) نعيد تفعيله لتجاوز UNIQUE
      const existing = await clientQueryOne(
        client,
        `SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2`,
        [input.courseId, input.studentId],
      );

      let rows: Record<string, unknown>[];
      if (existing) {
        rows = await clientQuery(
          client,
          `
          UPDATE enrollments SET
            status = $2, price_agreed = $3, amount_paid = 0,
            notes = $4, enrolled_at = now(), completed_at = NULL, updated_at = now()
          WHERE id = $1
          RETURNING *
          `,
          [existing.id, status, price, input.notes ?? null],
        );
      } else {
        rows = await clientQuery(
          client,
          `
          INSERT INTO enrollments (
            id, organization_id, course_id, student_id, status,
            price_agreed, amount_paid, notes
          ) VALUES ($1,$2,$3,$4,$5,$6,0,$7)
          RETURNING *
          `,
          [
            id,
            organizationId,
            input.courseId,
            input.studentId,
            status,
            price,
            input.notes ?? null,
          ],
        );
      }

      await recomputeCourseEnrolled(input.courseId, client);
      await recomputeStudentAggregates(input.studentId, client);
      return mapEnrollment(rows[0]);
    });
  },

  async updateEnrollmentStatus(
    id: string,
    status: EnrollmentStatus,
  ): Promise<Enrollment | null> {
    return withTransaction(async (client) => {
      const rows = await clientQuery(
        client,
        `
        UPDATE enrollments SET
          status = $2,
          completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE completed_at END,
          updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [id, status],
      );
      if (!rows[0]) return null;
      const enr = mapEnrollment(rows[0]);
      await recomputeCourseEnrolled(enr.courseId, client);
      await recomputeStudentAggregates(enr.studentId, client);
      return enr;
    });
  },

  async deleteEnrollment(id: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const rows = await clientQuery(
        client,
        `DELETE FROM enrollments WHERE id = $1 RETURNING *`,
        [id],
      );
      if (!rows[0]) return false;
      const enr = mapEnrollment(rows[0]);
      await recomputeCourseEnrolled(enr.courseId, client);
      await recomputeStudentAggregates(enr.studentId, client);
      return true;
    });
  },

  // ── Attendance ───────────────────────────────────────────────────────

  async listAttendance(
    organizationId: string,
    filters?: AttendanceFilters,
  ): Promise<AttendanceWithDetails[]> {
    const clauses = ["a.organization_id = $1"];
    const params: unknown[] = [organizationId];
    let i = 2;

    if (filters?.courseId && filters.courseId !== "all") {
      clauses.push(`a.course_id = $${i++}`);
      params.push(filters.courseId);
    }
    if (filters?.studentId && filters.studentId !== "all") {
      clauses.push(`a.student_id = $${i++}`);
      params.push(filters.studentId);
    }
    if (filters?.sessionDate) {
      clauses.push(`a.session_date = $${i++}::date`);
      params.push(filters.sessionDate);
    }
    if (filters?.status && filters.status !== "all") {
      clauses.push(`a.status = $${i++}`);
      params.push(filters.status);
    }

    const rows = await query(
      `
      SELECT a.*,
        s.full_name AS student_name,
        s.code AS student_code,
        c.title AS course_title
      FROM attendance_records a
      JOIN students s ON s.id = a.student_id
      JOIN courses c ON c.id = a.course_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY a.session_date DESC, s.full_name
      `,
      params,
    );

    return rows.map((row) => ({
      ...mapAttendance(row),
      studentName: String(row.student_name ?? "—"),
      studentCode: String(row.student_code ?? "—"),
      courseTitle: String(row.course_title ?? "—"),
    }));
  },

  async getAttendanceRoster(
    organizationId: string,
    courseId: string,
    sessionDate: string,
  ): Promise<AttendanceSessionRosterItem[]> {
    const rows = await query(
      `
      SELECT
        e.id AS enrollment_id,
        e.student_id,
        s.full_name AS student_name,
        s.code AS student_code,
        a.id AS att_id,
        a.organization_id AS att_org,
        a.course_id AS att_course,
        a.student_id AS att_student,
        a.enrollment_id AS att_enr,
        a.session_date,
        a.session_number,
        a.status AS att_status,
        a.notes AS att_notes,
        a.recorded_by,
        a.created_at AS att_created,
        a.updated_at AS att_updated
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      LEFT JOIN attendance_records a
        ON a.course_id = e.course_id
        AND a.student_id = e.student_id
        AND a.session_date = $3::date
      WHERE e.organization_id = $1
        AND e.course_id = $2
        AND e.status IN ('active', 'pending')
      ORDER BY s.full_name
      `,
      [organizationId, courseId, sessionDate],
    );

    return rows.map((row) => {
      let record: AttendanceRecord | null = null;
      if (row.att_id) {
        record = mapAttendance({
          id: row.att_id,
          organization_id: row.att_org,
          course_id: row.att_course,
          student_id: row.att_student,
          enrollment_id: row.att_enr,
          session_date: row.session_date,
          session_number: row.session_number,
          status: row.att_status,
          notes: row.att_notes,
          recorded_by: row.recorded_by,
          created_at: row.att_created,
          updated_at: row.att_updated,
        });
      }
      return {
        studentId: String(row.student_id),
        studentName: String(row.student_name ?? "—"),
        studentCode: String(row.student_code ?? "—"),
        enrollmentId: String(row.enrollment_id),
        record,
      };
    });
  },

  async getAttendanceStats(
    organizationId: string,
    filters?: AttendanceFilters,
  ): Promise<AttendanceStats> {
    const rows = await this.listAttendance(organizationId, filters);
    const present = rows.filter((r) => r.status === "present").length;
    const absent = rows.filter((r) => r.status === "absent").length;
    const late = rows.filter((r) => r.status === "late").length;
    const excused = rows.filter((r) => r.status === "excused").length;
    const totalMarked = rows.length;
    const rate = totalMarked > 0 ? (present + late) / totalMarked : 0;
    return { present, absent, late, excused, totalMarked, rate };
  },

  async upsertAttendance(
    organizationId: string,
    input: AttendanceInput,
    recordedBy?: string,
  ): Promise<AttendanceRecord> {
    return withTransaction(async (client) => {
      const rows = await clientQuery(
        client,
        `
        INSERT INTO attendance_records (
          id, organization_id, course_id, student_id, enrollment_id,
          session_date, session_number, status, notes, recorded_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6::date, $7, $8, $9, $10
        )
        ON CONFLICT (course_id, student_id, session_date) DO UPDATE SET
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          session_number = COALESCE(EXCLUDED.session_number, attendance_records.session_number),
          enrollment_id = COALESCE(EXCLUDED.enrollment_id, attendance_records.enrollment_id),
          recorded_by = COALESCE(EXCLUDED.recorded_by, attendance_records.recorded_by),
          updated_at = now()
        RETURNING *
        `,
        [
          `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          organizationId,
          input.courseId,
          input.studentId,
          input.enrollmentId ?? null,
          input.sessionDate,
          input.sessionNumber ?? null,
          input.status,
          input.notes ?? null,
          recordedBy ?? null,
        ],
      );
      await recomputeStudentAggregates(input.studentId, client);
      return mapAttendance(rows[0]);
    });
  },

  async bulkUpsertAttendance(
    organizationId: string,
    items: AttendanceInput[],
    recordedBy?: string,
  ): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];
    for (const item of items) {
      results.push(
        await this.upsertAttendance(organizationId, item, recordedBy),
      );
    }
    return results;
  },

  // ── Student payments ─────────────────────────────────────────────────

  async listStudentPayments(
    organizationId: string,
    filters?: StudentPaymentFilters,
  ): Promise<StudentPaymentWithDetails[]> {
    const clauses = ["p.organization_id = $1"];
    const params: unknown[] = [organizationId];
    let i = 2;

    if (filters?.studentId && filters.studentId !== "all") {
      clauses.push(`p.student_id = $${i++}`);
      params.push(filters.studentId);
    }
    if (filters?.courseId && filters.courseId !== "all") {
      clauses.push(`p.course_id = $${i++}`);
      params.push(filters.courseId);
    }
    if (filters?.method && filters.method !== "all") {
      clauses.push(`p.method = $${i++}`);
      params.push(filters.method);
    }
    if (filters?.status && filters.status !== "all") {
      clauses.push(`p.status = $${i++}`);
      params.push(filters.status);
    }
    if (filters?.query?.trim()) {
      clauses.push(`(
        s.full_name ILIKE $${i} OR s.code ILIKE $${i}
        OR COALESCE(p.reference,'') ILIKE $${i}
        OR COALESCE(c.title,'') ILIKE $${i}
      )`);
      params.push(`%${filters.query.trim()}%`);
      i++;
    }

    const rows = await query(
      `
      SELECT p.*,
        s.full_name AS student_name,
        s.code AS student_code,
        c.title AS course_title
      FROM student_payments p
      JOIN students s ON s.id = p.student_id
      LEFT JOIN courses c ON c.id = p.course_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY p.paid_at DESC
      `,
      params,
    );

    return rows.map((row) => ({
      ...mapPayment(row),
      studentName: String(row.student_name ?? "—"),
      studentCode: String(row.student_code ?? "—"),
      courseTitle: row.course_title ? String(row.course_title) : null,
    }));
  },

  async getPaymentStats(organizationId: string): Promise<PaymentStats> {
    const row = await queryOne<{
      total_collected: string;
      pending_amount: string;
      refunded_amount: string;
      payments_this_month: string;
      count: string;
    }>(
      `
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::text AS total_collected,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::text AS pending_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0)::text AS refunded_amount,
        COUNT(*) FILTER (
          WHERE status = 'completed' AND paid_at >= date_trunc('month', now())
        )::text AS payments_this_month,
        COUNT(*)::text AS count
      FROM student_payments
      WHERE organization_id = $1
      `,
      [organizationId],
    );

    return {
      totalCollected: Number(row?.total_collected ?? 0),
      pendingAmount: Number(row?.pending_amount ?? 0),
      refundedAmount: Number(row?.refunded_amount ?? 0),
      paymentsThisMonth: Number(row?.payments_this_month ?? 0),
      count: Number(row?.count ?? 0),
    };
  },

  async createStudentPayment(
    organizationId: string,
    input: StudentPaymentInput,
  ): Promise<StudentPayment> {
    if (input.amount <= 0) throw new Error("INVALID_AMOUNT");

    return withTransaction(async (client) => {
      const student = await clientQueryOne(
        client,
        `SELECT id FROM students WHERE id = $1 AND organization_id = $2`,
        [input.studentId, organizationId],
      );
      if (!student) throw new Error("STUDENT_NOT_FOUND");

      let courseId = input.courseId ?? null;
      if (input.enrollmentId) {
        const enr = await clientQueryOne<{ course_id: string }>(
          client,
          `SELECT course_id FROM enrollments WHERE id = $1`,
          [input.enrollmentId],
        );
        if (enr) courseId = courseId ?? enr.course_id;
      }

      const id = `pay_${Date.now().toString(36)}`;
      const rows = await clientQuery(
        client,
        `
        INSERT INTO student_payments (
          id, organization_id, student_id, enrollment_id, course_id,
          amount, currency, method, status, paid_at, reference, notes
        ) VALUES (
          $1,$2,$3,$4,$5,$6,'SAR',$7,$8,COALESCE($9::timestamptz, now()),$10,$11
        )
        RETURNING *
        `,
        [
          id,
          organizationId,
          input.studentId,
          input.enrollmentId ?? null,
          courseId,
          input.amount,
          input.method,
          input.status ?? "completed",
          input.paidAt || null,
          input.reference ?? null,
          input.notes ?? null,
        ],
      );

      const payment = mapPayment(rows[0]);
      if (payment.enrollmentId) {
        await recomputeEnrollmentPaid(payment.enrollmentId, client);
      }
      await recomputeStudentAggregates(payment.studentId, client);
      return payment;
    });
  },

  async updateStudentPayment(
    id: string,
    input: Partial<StudentPaymentInput> & { status?: StudentPayment["status"] },
  ): Promise<StudentPayment | null> {
    return withTransaction(async (client) => {
      const current = await clientQueryOne(
        client,
        `SELECT * FROM student_payments WHERE id = $1`,
        [id],
      );
      if (!current) return null;
      const cur = mapPayment(current);

      const rows = await clientQuery(
        client,
        `
        UPDATE student_payments SET
          amount = $2,
          method = $3,
          status = $4,
          paid_at = COALESCE($5::timestamptz, paid_at),
          reference = $6,
          notes = $7,
          enrollment_id = $8,
          course_id = $9,
          updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          input.amount ?? cur.amount,
          input.method ?? cur.method,
          input.status ?? cur.status,
          input.paidAt || null,
          input.reference !== undefined ? input.reference : cur.reference ?? null,
          input.notes !== undefined ? input.notes : cur.notes ?? null,
          input.enrollmentId !== undefined
            ? input.enrollmentId
            : cur.enrollmentId,
          input.courseId !== undefined ? input.courseId : cur.courseId,
        ],
      );

      const payment = mapPayment(rows[0]);
      if (payment.enrollmentId) {
        await recomputeEnrollmentPaid(payment.enrollmentId, client);
      }
      if (cur.enrollmentId && cur.enrollmentId !== payment.enrollmentId) {
        await recomputeEnrollmentPaid(cur.enrollmentId, client);
      }
      await recomputeStudentAggregates(payment.studentId, client);
      return payment;
    });
  },

  async deleteStudentPayment(id: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const rows = await clientQuery(
        client,
        `DELETE FROM student_payments WHERE id = $1 RETURNING *`,
        [id],
      );
      if (!rows[0]) return false;
      const payment = mapPayment(rows[0]);
      if (payment.enrollmentId) {
        await recomputeEnrollmentPaid(payment.enrollmentId, client);
      }
      await recomputeStudentAggregates(payment.studentId, client);
      return true;
    });
  },

  snapshot() {
    return { mode: "postgres" as const };
  },
};
