-- =============================================================================
-- بيت المصور — PostgreSQL schema (Railway-ready)
-- يشمل جداول Auth.js + النطاق التدريبي
-- psql "$DATABASE_URL" -f db/schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- المؤسسات
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  owner_id      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Auth.js — users / accounts / sessions / verification_token
-- (متوافق مع @auth/pg-adapter)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name              TEXT,
  email             TEXT UNIQUE,
  "emailVerified"   TIMESTAMPTZ,
  image             TEXT,
  -- توسيعات التطبيق
  password_hash     TEXT,
  phone             TEXT,
  role              TEXT NOT NULL DEFAULT 'viewer'
                      CHECK (role IN ('owner','admin','manager','employee','viewer')),
  organization_id   TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  locale            TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar','en')),
  theme             TEXT NOT NULL DEFAULT 'system'
                      CHECK (theme IN ('light','dark','system')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ترحيل آمن لقواعد موجودة مسبقاً
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS accounts (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL,
  provider              TEXT NOT NULL,
  "providerAccountId"   TEXT NOT NULL,
  refresh_token         TEXT,
  access_token          TEXT,
  expires_at            BIGINT,
  token_type            TEXT,
  scope                 TEXT,
  id_token              TEXT,
  session_state         TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts("userId");

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionToken"  TEXT NOT NULL UNIQUE,
  "userId"        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires         TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions("sessionToken");

-- اسم الجدول كما يتوقعه @auth/pg-adapter (مفرد)
CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  token      TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ---------------------------------------------------------------------------
-- profiles — طبقة التطبيق (role/org) مرتبطة بـ users.id
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id               TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('owner','admin','manager','employee','viewer')),
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar','en')),
  phone            TEXT,
  avatar_url       TEXT,
  theme            TEXT NOT NULL DEFAULT 'system'
                     CHECK (theme IN ('light','dark','system')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS students (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id         TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code                    TEXT NOT NULL,
  full_name               TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  national_id             TEXT,
  gender                  TEXT NOT NULL CHECK (gender IN ('male','female')),
  date_of_birth           DATE,
  city                    TEXT NOT NULL DEFAULT '',
  address                 TEXT,
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','inactive','graduated','suspended')),
  level                   TEXT NOT NULL DEFAULT 'beginner'
                            CHECK (level IN ('beginner','intermediate','advanced','professional')),
  source                  TEXT NOT NULL DEFAULT 'walk_in',
  notes                   TEXT,
  avatar_url              TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  enrolled_courses_count  INT NOT NULL DEFAULT 0,
  total_paid              NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_attendance_at      TIMESTAMPTZ,
  joined_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_students_org ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(organization_id, status);

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS courses (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code             TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL DEFAULT 'basics',
  level            TEXT NOT NULL DEFAULT 'beginner'
                     CHECK (level IN ('beginner','intermediate','advanced','professional')),
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','open','full','in_progress','completed','cancelled')),
  price            NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_hours   INT NOT NULL DEFAULT 0,
  sessions_count   INT NOT NULL DEFAULT 1,
  max_seats        INT NOT NULL DEFAULT 12,
  instructor_name  TEXT,
  start_date       DATE,
  end_date         DATE,
  schedule_note    TEXT,
  enrolled_count   INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(organization_id, status);

-- ---------------------------------------------------------------------------
-- Enrollments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS enrollments (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('pending','active','completed','dropped','refunded')),
  price_agreed     NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid      NUMERIC(12,2) NOT NULL DEFAULT 0,
  enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_org ON enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS attendance_records (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id    TEXT REFERENCES enrollments(id) ON DELETE SET NULL,
  session_date     DATE NOT NULL,
  session_number   INT,
  status           TEXT NOT NULL
                     CHECK (status IN ('present','absent','late','excused')),
  notes            TEXT,
  recorded_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_org ON attendance_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(course_id, session_date);

-- ---------------------------------------------------------------------------
-- Student tuition payments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_payments (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id    TEXT REFERENCES enrollments(id) ON DELETE SET NULL,
  course_id        TEXT REFERENCES courses(id) ON DELETE SET NULL,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency         TEXT NOT NULL DEFAULT 'SAR',
  method           TEXT NOT NULL
                     CHECK (method IN ('cash','card','transfer','stc_pay','apple_pay','other')),
  status           TEXT NOT NULL DEFAULT 'completed'
                     CHECK (status IN ('pending','completed','failed','refunded')),
  paid_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference        TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_payments_org ON student_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_student ON student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_paid_at ON student_payments(organization_id, paid_at DESC);

-- ---------------------------------------------------------------------------
-- Customers (B2B / شركاء — ليسوا متدربين)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  company          TEXT,
  status           TEXT NOT NULL DEFAULT 'lead'
                     CHECK (status IN ('active','inactive','lead')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(organization_id, lower(email));

-- ---------------------------------------------------------------------------
-- Reports (تقارير محفوظة)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'custom'
                     CHECK (type IN ('sales','attendance','financial','custom')),
  filters          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_org ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(organization_id, created_at DESC);

-- اختياري: تشغيلات/نتائج التقارير
CREATE TABLE IF NOT EXISTS report_runs (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  report_id        TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'ready'
                     CHECK (status IN ('ready','processing','failed')),
  result_summary   JSONB,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_runs_report ON report_runs(report_id);

-- ---------------------------------------------------------------------------
-- Organization subscriptions (Stripe-backed)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id           TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id                   TEXT NOT NULL DEFAULT 'free'
                              CHECK (plan_id IN ('free','starter','pro','enterprise')),
  status                    TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('trialing','active','past_due','canceled','incomplete','unpaid')),
  interval                  TEXT NOT NULL DEFAULT 'month'
                              CHECK (interval IN ('month','year')),
  current_period_end        TIMESTAMPTZ,
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subs_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subs_stripe ON organization_subscriptions(stripe_subscription_id);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS invoices (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id   TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  number            TEXT NOT NULL,
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'SAR',
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('paid','open','void','uncollectible')),
  stripe_invoice_id TEXT,
  pdf_url           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Analytics (monthly aggregated data)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics_points (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id   TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label             TEXT NOT NULL,
  revenue           NUMERIC(12,2) NOT NULL DEFAULT 0,
  customers         INT NOT NULL DEFAULT 0,
  churn             NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, label)
);

CREATE INDEX IF NOT EXISTS idx_analytics_org ON analytics_points(organization_id);
