# نشر بيت المصور على Railway

## المتطلبات
- حساب [Railway](https://railway.app)
- ريبو GitHub للمشروع
- (اختياري) حساب Stripe Test Mode

## خطوات من الصفر

### 1) ارفع الكود على GitHub
انظر README أو القسم أدناه في هذا الملف.

### 2) مشروع Railway
1. **New Project** → **Deploy from GitHub repo**
2. اختر الريبو `saas-dashboard-arabic` (أو اسمك)
3. Railway يكتشف Next.js عبر `railway.toml` / Nixpacks

### 3) أضف PostgreSQL
1. في نفس المشروع: **+ New** → **Database** → **PostgreSQL**
2. افتح خدمة التطبيق → **Variables**
3. **Add Reference** → `DATABASE_URL` من خدمة Postgres  
   (أو انسخ Connection URL يدوياً)

### 4) متغيرات البيئة (التطبيق)
| المتغير | مطلوب | ملاحظات |
|---------|--------|---------|
| `DATABASE_URL` | نعم | من Postgres |
| `AUTH_SECRET` | نعم | سلسلة عشوائية طويلة |
| `AUTH_TRUST_HOST` | نعم | `true` |
| `NEXT_PUBLIC_APP_URL` | نعم | `https://your-app.up.railway.app` |
| `NEXT_PUBLIC_APP_NAME` | لا | `بيت المصور` |
| `STRIPE_SECRET_KEY` | لا* | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | لا* | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | لا* | بعد إنشاء Webhook |
| `STRIPE_PRICE_ID_MONTHLY` | لا* | `price_...` |
| `STRIPE_PRICE_ID_YEARLY` | لا* | `price_...` |

\* بدون Stripe حقيقي تظهر رسالة Dummy ولا ينهار التطبيق.

ولّد `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5) نفّذ Schema + Seed
من جهازك (بعد نسخ `DATABASE_URL` العام من Railway):

```bash
# PowerShell
$env:DATABASE_URL="postgresql://..."
npm run db:setup
```

أو:
```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql
```

**Docker بدون psql محلي:**
```bash
docker run --rm -i postgres:16-alpine psql "$DATABASE_URL" < db/schema.sql
docker run --rm -i postgres:16-alpine psql "$DATABASE_URL" < db/seed.sql
```

### 6) نطاق التطبيق
1. Settings → **Generate Domain** أو نطاق مخصص
2. حدّث `NEXT_PUBLIC_APP_URL` ليطابق الـ HTTPS domain
3. أعد Deploy

### 7) Stripe Webhook (اختياري)
Endpoint:
```
https://YOUR-DOMAIN/api/webhooks/stripe
```
Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

### 8) SSL و Connection Pooling
- **SSL**: الكود في `lib/db/postgres.ts` يفعّل SSL تلقائياً عندما الـ host ليس localhost.
- **Pooling**: على Railway استخدم الرابط العادي أولاً. إن احتجت PgBouncer لاحقاً، أضف `?sslmode=require` حسب توصية Railway.
- **حد الاتصالات**: الـ pool مضبوط على `max: 10` — مناسب لنسخة واحدة من التطبيق.

### 9) تحقق
- افتح النطاق → `/login`
- `owner@example.com` / `password123`
- لوحة التحكم + المتدربون + الإعدادات

---

## أوامر GitHub السريعة

```bash
git init
git add .
git commit -m "feat: Bayt Al-Musawir SaaS dashboard ready for Railway"
git branch -M main
gh repo create saas-dashboard-arabic --private --source=. --remote=origin --push
# أو يدوياً:
# git remote add origin https://github.com/USER/saas-dashboard-arabic.git
# git push -u origin main
```
