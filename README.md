# بيت المصور — لوحة تحكم SaaS

نظام إدارة لمركز **بيت المصور** للتدريب على التصوير (جدة) — عربي أولاً مع RTL، وواجهة ثنائية اللغة (AR/EN).

## التقنيات

| الطبقة | الاختيار |
|--------|----------|
| Framework | **Next.js 16** (App Router + `proxy.ts`) |
| UI | React 19 · Tailwind CSS v4 · Cairo · Lucide · Recharts |
| Auth | **Auth.js v5** (Credentials + JWT) |
| DB | **PostgreSQL** على Railway أو **Mock** محلياً بدون DB |
| Billing | **Stripe** Test Mode (Checkout + Portal + Webhook) |
| RBAC | Owner · Admin · Manager · Employee · Viewer |

## الوحدات

- المتدربون · الدورات · الحضور · مدفوعات المتدربين  
- العملاء · التقارير · التحليلات  
- الفوترة (اشتراك SaaS عبر Stripe)  
- الإعدادات (ملف شخصي · فريق · كلمة المرور)

## التشغيل المحلي

### 1) التثبيت

```bash
git clone https://github.com/YOUR_USER/saas-dashboard-arabic.git
cd saas-dashboard-arabic
cp .env.example .env.local
npm install
```

### 2) المتغيرات الأساسية (`.env.local`)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=generate-a-long-secret
AUTH_TRUST_HOST=true
# DATABASE_URL=postgresql://bayt:bayt@localhost:5432/bayt
```

بدون `DATABASE_URL` يعمل التطبيق بـ **Mock** (بيانات في الذاكرة).

### 3) Postgres محلي (اختياري)

```bash
npm run db:up
# ثم في .env.local:
# DATABASE_URL=postgresql://bayt:bayt@localhost:5432/bayt

npm run db:setup
```

### 4) التشغيل

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

### حسابات تجريبية

| البريد | الدور | كلمة المرور |
|--------|--------|-------------|
| owner@example.com | Owner | password123 |
| admin@example.com | Admin | password123 |
| manager@example.com | Manager | password123 |
| employee@example.com | Employee | password123 |
| viewer@example.com | Viewer | password123 |

## متغيرات البيئة (كاملة)

| المتغير | مطلوب | الوصف |
|---------|--------|--------|
| `DATABASE_URL` | للإنتاج | رابط PostgreSQL |
| `AUTH_SECRET` | نعم | سر جلسات Auth.js |
| `AUTH_TRUST_HOST` | Railway: `true` | خلف البروكسي |
| `NEXT_PUBLIC_APP_URL` | نعم | رابط التطبيق العام |
| `NEXT_PUBLIC_APP_NAME` | لا | اسم التطبيق |
| `STRIPE_SECRET_KEY` | للدفع | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | للدفع | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook | `whsec_...` |
| `STRIPE_PRICE_ID_MONTHLY` | للدفع | `price_...` |
| `STRIPE_PRICE_ID_YEARLY` | للدفع | `price_...` |

القائمة الكاملة مع القيم التجريبية: [`.env.example`](./.env.example).

## سكربتات مفيدة

```bash
npm run dev          # تطوير
npm run build        # بناء
npm run start        # تشغيل الإنتاج
npm run db:up        # Docker Postgres
npm run db:setup     # schema.sql + seed.sql
npm run db:schema    # جداول فقط
npm run db:seed      # بيانات تجريبية
```

## النشر على Railway

دليل مفصّل: [`docs/DEPLOY_RAILWAY.md`](./docs/DEPLOY_RAILWAY.md)

### ملخص سريع

1. ارفع المشروع على **GitHub**
2. Railway → **New Project** → من الريبو
3. أضف **PostgreSQL** واربط `DATABASE_URL`
4. أضف المتغيرات: `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_APP_URL`, Stripe (اختياري)
5. من جهازك: `npm run db:setup` باستخدام `DATABASE_URL` من Railway
6. Generate Domain وحدّث `NEXT_PUBLIC_APP_URL`
7. سجّل الدخول بالحسابات التجريبية

### SSL و Pooling

- SSL يُفعَّل تلقائياً لغير `localhost` في `lib/db/postgres.ts`
- Connection pool: حتى 10 اتصالات لكل instance
- لا تستخدم mock في الإنتاج — عيّن `DATABASE_URL` دائماً على Railway

## هيكل مختصر

```
app/(auth)/          تسجيل الدخول والتسجيل
app/(app)/           لوحة محمية (طلاب، دورات، …)
app/api/auth/        Auth.js
app/api/webhooks/    Stripe
auth.ts              إعداد Auth.js
lib/db/              Dual-mode: mock | postgres
db/schema.sql        مخطط PostgreSQL
db/seed.sql          بيانات تجريبية
proxy.ts             حماية المسارات (Next 16)
railway.toml         إعداد نشر Railway
```

## الترخيص

Private — بيت المصور.
