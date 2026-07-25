-- =============================================================================
-- بيانات تجريبية — بيت المصور
-- كلمة المرور لكل الحسابات: password123
-- bcrypt: $2b$10$u/MHqbBKAfD1nQUa9GEjpuP0CJV1s0ED.VDW1mUIGK2YVVnuY19l6
-- psql "$DATABASE_URL" -f db/seed.sql
-- =============================================================================

INSERT INTO organizations (id, name, slug, owner_id, created_at)
VALUES (
  'org_demo_001',
  'بيت المصور',
  'bayt-al-musawir',
  'user_owner_001',
  '2025-01-12T10:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- مستخدمو Auth.js (مع password_hash)
INSERT INTO users (
  id, name, email, "emailVerified", image, password_hash,
  role, organization_id, locale, created_at
) VALUES
(
  'user_owner_001', 'أحمد المنصوري', 'owner@example.com', now(), NULL,
  '$2b$10$u/MHqbBKAfD1nQUa9GEjpuP0CJV1s0ED.VDW1mUIGK2YVVnuY19l6',
  'owner', 'org_demo_001', 'ar', '2025-01-12T10:00:00Z'
),
(
  'user_admin_001', 'سارة العتيبي', 'admin@example.com', now(), NULL,
  '$2b$10$u/MHqbBKAfD1nQUa9GEjpuP0CJV1s0ED.VDW1mUIGK2YVVnuY19l6',
  'admin', 'org_demo_001', 'ar', '2025-02-01T09:00:00Z'
),
(
  'user_manager_001', 'خالد الحربي', 'manager@example.com', now(), NULL,
  '$2b$10$u/MHqbBKAfD1nQUa9GEjpuP0CJV1s0ED.VDW1mUIGK2YVVnuY19l6',
  'manager', 'org_demo_001', 'en', '2025-03-04T11:30:00Z'
),
(
  'user_employee_001', 'نورة الشمري', 'employee@example.com', now(), NULL,
  '$2b$10$u/MHqbBKAfD1nQUa9GEjpuP0CJV1s0ED.VDW1mUIGK2YVVnuY19l6',
  'employee', 'org_demo_001', 'ar', '2025-04-18T08:15:00Z'
),
(
  'user_viewer_001', 'Faisal Alotaibi', 'viewer@example.com', now(), NULL,
  '$2b$10$u/MHqbBKAfD1nQUa9GEjpuP0CJV1s0ED.VDW1mUIGK2YVVnuY19l6',
  'viewer', 'org_demo_001', 'en', '2025-05-22T14:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- profiles (مرآة للتطبيق / RBAC)
INSERT INTO profiles (id, email, full_name, role, organization_id, locale, created_at) VALUES
  ('user_owner_001', 'owner@example.com', 'أحمد المنصوري', 'owner', 'org_demo_001', 'ar', '2025-01-12T10:00:00Z'),
  ('user_admin_001', 'admin@example.com', 'سارة العتيبي', 'admin', 'org_demo_001', 'ar', '2025-02-01T09:00:00Z'),
  ('user_manager_001', 'manager@example.com', 'خالد الحربي', 'manager', 'org_demo_001', 'en', '2025-03-04T11:30:00Z'),
  ('user_employee_001', 'employee@example.com', 'نورة الشمري', 'employee', 'org_demo_001', 'ar', '2025-04-18T08:15:00Z'),
  ('user_viewer_001', 'viewer@example.com', 'Faisal Alotaibi', 'viewer', 'org_demo_001', 'en', '2025-05-22T14:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- حساب credentials في accounts (اختياري — للاتساق مع Auth.js)
INSERT INTO accounts (id, "userId", type, provider, "providerAccountId")
SELECT
  'acc_' || id, id, 'credentials', 'credentials', email
FROM users
WHERE id LIKE 'user_%'
ON CONFLICT (provider, "providerAccountId") DO NOTHING;

-- متدربون
INSERT INTO students (
  id, organization_id, code, full_name, email, phone, national_id, gender,
  date_of_birth, city, address, status, level, source, notes,
  emergency_contact_name, emergency_contact_phone,
  enrolled_courses_count, total_paid, last_attendance_at, joined_at, created_at, updated_at
) VALUES
(
  'stu_001', 'org_demo_001', 'STU-00101', 'عبدالله بن فهد العتيبي',
  'abdullah.otaibi@email.sa', '0501234567', '1098765432', 'male',
  '1998-04-12', 'جدة', 'حي الزهراء، شارع الأمير سلطان', 'active', 'intermediate', 'instagram',
  'مهتم بتصوير البورتريه والضوء الطبيعي', 'فهد العتيبي', '0559876543',
  2, 4800, '2026-07-20T16:00:00Z', '2026-01-15T09:00:00Z', '2026-01-15T09:00:00Z', '2026-07-20T16:00:00Z'
),
(
  'stu_002', 'org_demo_001', 'STU-00102', 'نورة سعد الغامدي',
  'noura.ghamdi@email.sa', '0552345678', '1087654321', 'female',
  '2001-09-03', 'جدة', 'حي الشاطئ', 'active', 'beginner', 'snapchat',
  'تبدأ أول دورة تصوير أساسي', 'سعد الغامدي', '0501122334',
  1, 1500, '2026-07-22T18:30:00Z', '2026-06-02T11:20:00Z', '2026-06-02T11:20:00Z', '2026-07-22T18:30:00Z'
),
(
  'stu_003', 'org_demo_001', 'STU-00103', 'ياسر محمد الحربي',
  'yasser.harbi@email.sa', '0533456789', NULL, 'male',
  '1995-12-21', 'مكة', NULL, 'active', 'advanced', 'referral',
  'موصى به من المدرب خالد', NULL, NULL,
  3, 9200, '2026-07-18T14:00:00Z', '2025-09-10T08:00:00Z', '2025-09-10T08:00:00Z', '2026-07-18T14:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO courses (
  id, organization_id, code, title, description, category, level, status,
  price, duration_hours, sessions_count, max_seats, instructor_name,
  start_date, end_date, schedule_note, enrolled_count, created_at, updated_at
) VALUES
(
  'crs_001', 'org_demo_001', 'CRS-0001', 'أساسيات التصوير الفوتوغرافي',
  'مدخل شامل للكاميرا، التعريض، والتكوين للمبتدئين.',
  'basics', 'beginner', 'in_progress', 1500, 18, 6, 12, 'خالد الحربي',
  '2026-06-15', '2026-07-27', 'أحد وثلاثاء · 6:00 م', 3,
  '2026-05-01T10:00:00Z', '2026-07-20T10:00:00Z'
),
(
  'crs_002', 'org_demo_001', 'CRS-0002', 'تصوير البورتريه والضوء الطبيعي',
  'تقنيات الإضاءة الطبيعية والاستوديو الخفيف للبورتريه.',
  'portrait', 'intermediate', 'open', 2200, 24, 8, 10, 'سارة العتيبي',
  '2026-08-03', '2026-09-14', 'إثنين وأربعاء · 7:00 م', 2,
  '2026-06-10T10:00:00Z', '2026-07-18T10:00:00Z'
),
(
  'crs_003', 'org_demo_001', 'CRS-0003', 'تصوير المنتجات والتجارة الإلكترونية',
  'إعداد الاستوديو، الخلفية، وتحرير صور المنتجات.',
  'product', 'intermediate', 'open', 2800, 20, 7, 8, 'أحمد المنصوري',
  '2026-08-10', '2026-09-21', 'سبت · 4:00 م', 1,
  '2026-06-20T10:00:00Z', '2026-07-15T10:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO enrollments (
  id, organization_id, course_id, student_id, status,
  price_agreed, amount_paid, enrolled_at, notes, created_at, updated_at
) VALUES
  ('enr_001', 'org_demo_001', 'crs_001', 'stu_001', 'active', 1500, 1500, '2026-06-10T09:00:00Z', NULL, '2026-06-10T09:00:00Z', '2026-06-12T09:00:00Z'),
  ('enr_002', 'org_demo_001', 'crs_002', 'stu_001', 'active', 2200, 1100, '2026-07-01T11:00:00Z', 'دفعة أولى 50%', '2026-07-01T11:00:00Z', '2026-07-05T11:00:00Z'),
  ('enr_003', 'org_demo_001', 'crs_001', 'stu_002', 'active', 1500, 1500, '2026-06-12T10:00:00Z', NULL, '2026-06-12T10:00:00Z', '2026-06-12T10:00:00Z'),
  ('enr_004', 'org_demo_001', 'crs_001', 'stu_003', 'active', 1500, 1500, '2026-06-08T08:00:00Z', NULL, '2026-06-08T08:00:00Z', '2026-06-08T08:00:00Z'),
  ('enr_005', 'org_demo_001', 'crs_002', 'stu_002', 'pending', 2200, 0, '2026-07-20T14:00:00Z', 'بانتظار الدفعة الأولى', '2026-07-20T14:00:00Z', '2026-07-20T14:00:00Z'),
  ('enr_006', 'org_demo_001', 'crs_003', 'stu_003', 'active', 2800, 2800, '2026-07-05T09:00:00Z', NULL, '2026-07-05T09:00:00Z', '2026-07-06T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO attendance_records (
  id, organization_id, course_id, student_id, enrollment_id,
  session_date, session_number, status, notes, recorded_by, created_at, updated_at
) VALUES
  ('att_001', 'org_demo_001', 'crs_001', 'stu_001', 'enr_001', '2026-07-20', 5, 'present', NULL, 'user_employee_001', '2026-07-20T16:05:00Z', '2026-07-20T16:05:00Z'),
  ('att_002', 'org_demo_001', 'crs_001', 'stu_002', 'enr_003', '2026-07-20', 5, 'late', 'تأخر 15 دقيقة', 'user_employee_001', '2026-07-20T16:20:00Z', '2026-07-20T16:20:00Z'),
  ('att_003', 'org_demo_001', 'crs_001', 'stu_003', 'enr_004', '2026-07-20', 5, 'present', NULL, 'user_employee_001', '2026-07-20T16:05:00Z', '2026-07-20T16:05:00Z'),
  ('att_004', 'org_demo_001', 'crs_002', 'stu_001', 'enr_002', '2026-07-22', 1, 'present', NULL, 'user_employee_001', '2026-07-22T18:30:00Z', '2026-07-22T18:30:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_payments (
  id, organization_id, student_id, enrollment_id, course_id,
  amount, currency, method, status, paid_at, reference, notes, created_at, updated_at
) VALUES
  ('pay_001', 'org_demo_001', 'stu_001', 'enr_001', 'crs_001', 1500, 'SAR', 'transfer', 'completed', '2026-06-11T10:00:00Z', 'TRX-88211', NULL, '2026-06-11T10:00:00Z', '2026-06-11T10:00:00Z'),
  ('pay_002', 'org_demo_001', 'stu_001', 'enr_002', 'crs_002', 1100, 'SAR', 'card', 'completed', '2026-07-05T12:00:00Z', 'POS-4410', 'دفعة أولى', '2026-07-05T12:00:00Z', '2026-07-05T12:00:00Z'),
  ('pay_003', 'org_demo_001', 'stu_002', 'enr_003', 'crs_001', 1500, 'SAR', 'cash', 'completed', '2026-06-12T11:00:00Z', 'CASH-102', NULL, '2026-06-12T11:00:00Z', '2026-06-12T11:00:00Z'),
  ('pay_004', 'org_demo_001', 'stu_003', 'enr_004', 'crs_001', 1500, 'SAR', 'stc_pay', 'completed', '2026-06-09T09:30:00Z', 'STC-7781', NULL, '2026-06-09T09:30:00Z', '2026-06-09T09:30:00Z'),
  ('pay_005', 'org_demo_001', 'stu_003', 'enr_006', 'crs_003', 2800, 'SAR', 'transfer', 'completed', '2026-07-06T08:00:00Z', 'TRX-99001', NULL, '2026-07-06T08:00:00Z', '2026-07-06T08:00:00Z'),
  ('pay_008', 'org_demo_001', 'stu_002', 'enr_005', 'crs_002', 1100, 'SAR', 'transfer', 'pending', '2026-07-21T00:00:00Z', 'TRX-WAIT', 'بانتظار تأكيد التحويل', '2026-07-21T09:00:00Z', '2026-07-21T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- عملاء B2B
INSERT INTO customers (
  id, organization_id, name, email, phone, company, status, notes, created_at, updated_at
) VALUES
  ('cust_1', 'org_demo_001', 'محمد العلي', 'mohammed@acme.sa', '0501112233', 'Acme KSA', 'active', 'شريك تصوير فعاليات', '2026-01-10T00:00:00Z', '2026-07-23T09:00:00Z'),
  ('cust_2', 'org_demo_001', 'لمى الدوسري', 'lama@nova.io', '0552223344', 'Nova Labs', 'lead', 'مهتمة بدورات المنتجات', '2026-07-01T00:00:00Z', '2026-07-22T18:20:00Z'),
  ('cust_3', 'org_demo_001', 'يوسف الزهراني', 'yousef@orbit.com', '0533334455', 'Orbit Soft', 'active', NULL, '2025-11-03T00:00:00Z', '2026-07-21T12:00:00Z'),
  ('cust_4', 'org_demo_001', 'رهف السبيعي', 'rahaf@bloom.co', '0544445566', 'Bloom Co', 'inactive', 'توقف التعاون مؤقتاً', '2025-08-19T00:00:00Z', '2026-05-02T00:00:00Z'),
  ('cust_5', 'org_demo_001', 'Abdullah Mutairi', 'abdullah@pixel.dev', '0566667788', 'Pixel Dev', 'lead', 'Follow up on corporate package', '2026-07-20T00:00:00Z', '2026-07-20T00:00:00Z'),
  ('cust_6', 'org_demo_001', 'نورة القحطاني', 'noura@studio.sa', '0577778899', 'Studio N', 'active', 'تعاقد دورات موظفين', '2026-03-15T00:00:00Z', '2026-07-10T00:00:00Z'),
  ('cust_7', 'org_demo_001', 'خالد الفهد', 'khaled@events.sa', '0588889900', 'Events Co', 'lead', NULL, '2026-07-18T00:00:00Z', '2026-07-18T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- تقارير
INSERT INTO reports (
  id, organization_id, title, type, filters, created_by, created_at
) VALUES
  ('rep_1', 'org_demo_001', 'ملخص إيرادات الدورات — يوليو', 'financial',
   '{"month":"2026-07","currency":"SAR"}'::jsonb, 'user_owner_001', '2026-07-20T08:00:00Z'),
  ('rep_2', 'org_demo_001', 'حضور أساسيات التصوير', 'attendance',
   '{"courseId":"crs_001","from":"2026-06-15","to":"2026-07-27"}'::jsonb, 'user_manager_001', '2026-07-18T11:30:00Z'),
  ('rep_3', 'org_demo_001', 'مبيعات التسجيلات — الربع الثاني', 'sales',
   '{"quarter":"2026-Q2"}'::jsonb, 'user_admin_001', '2026-07-22T16:00:00Z'),
  ('rep_4', 'org_demo_001', 'تقرير مخصص — مصادر التسجيل', 'custom',
   '{"dimension":"source"}'::jsonb, 'user_owner_001', '2026-07-15T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- اشتراكات المؤسسة
INSERT INTO organization_subscriptions (
  id, organization_id, plan_id, status, interval,
  current_period_end, cancel_at_period_end,
  stripe_customer_id, stripe_subscription_id, created_at
) VALUES (
  'sub_1', 'org_demo_001', 'pro', 'active', 'month',
  '2026-08-24T00:00:00Z', FALSE,
  'cus_mock_pro', 'sub_mock_pro', '2026-01-12T10:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- فواتير
INSERT INTO invoices (
  id, organization_id, number, amount, currency, status, created_at
) VALUES
  ('inv_1', 'org_demo_001', 'INV-2026-014', 1199, 'SAR', 'paid', '2026-07-01T00:00:00Z'),
  ('inv_2', 'org_demo_001', 'INV-2026-013', 1199, 'SAR', 'paid', '2026-06-01T00:00:00Z'),
  ('inv_3', 'org_demo_001', 'INV-2026-012', 1199, 'SAR', 'open', '2026-05-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- نقاط التحليلات
INSERT INTO analytics_points (
  id, organization_id, label, revenue, customers, churn, created_at
) VALUES
  ('an_1', 'org_demo_001', 'يناير', 42000, 120, 2.1, '2026-01-31T00:00:00Z'),
  ('an_2', 'org_demo_001', 'فبراير', 38000, 132, 2.4, '2026-02-28T00:00:00Z'),
  ('an_3', 'org_demo_001', 'مارس', 51000, 151, 1.9, '2026-03-31T00:00:00Z'),
  ('an_4', 'org_demo_001', 'أبريل', 47000, 168, 2.0, '2026-04-30T00:00:00Z'),
  ('an_5', 'org_demo_001', 'مايو', 61000, 190, 1.6, '2026-05-31T00:00:00Z'),
  ('an_6', 'org_demo_001', 'يونيو', 58000, 205, 1.8, '2026-06-30T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
