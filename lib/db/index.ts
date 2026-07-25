/**
 * نقطة الدخول الموحدة لطبقة البيانات (Dual-mode)
 *
 * - DATABASE_URL موجود  → PostgreSQL (Railway / Docker / محلي)
 * - غير موجود           → Mock في الذاكرة (تطوير سريع بدون DB)
 *
 * الاستخدام:
 *   import { db } from "@/lib/db"
 *
 * أسماء الدوال ثابتة — لا تغيّرها حتى لا تنكسر الصفحات والـ Server Actions.
 */
import { isDatabaseConfigured, getDatabaseMode } from "@/lib/db/postgres";
import { mockRepository, type AppRepository } from "@/lib/db/mock-repository";
import { pgRepository } from "@/lib/db/pg-repository";

/**
 * Proxy: يختار المستودع عند أول استدعاء (بعد تحميل env).
 * الـ pool لا يُنشأ إلا عند أول query على Postgres.
 */
export const db: AppRepository = new Proxy({} as AppRepository, {
  get(_target, prop, receiver) {
    const repo: AppRepository = isDatabaseConfigured()
      ? (pgRepository as unknown as AppRepository)
      : mockRepository;
    const value = Reflect.get(repo, prop, receiver);
    return typeof value === "function" ? value.bind(repo) : value;
  },
});

export { isDatabaseConfigured, getDatabaseMode } from "@/lib/db/postgres";
export type { AppRepository } from "@/lib/db/mock-repository";

export function getDbDriverLabel(): string {
  return getDatabaseMode() === "postgres" ? "PostgreSQL" : "Mock (in-memory)";
}
