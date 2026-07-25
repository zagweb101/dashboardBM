/**
 * اتصال PostgreSQL + أدوات استعلام مشتركة
 * يُستخدم فقط عند وجود DATABASE_URL (Railway / Docker / محلي)
 */
import { Pool, type PoolClient, type QueryResultRow } from "pg";

/** هل وضع Postgres مفعّل؟ */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url);
}

export function getDatabaseMode(): "postgres" | "mock" {
  return isDatabaseConfigured() ? "postgres" : "mock";
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL غير معرّف. أضفه في .env.local أو عُد لوضع mock.",
    );
  }
  return url;
}

/**
 * Railway وغالباً مزودو السحابة يطلبون SSL.
 * محلياً (localhost) نعطّل SSL.
 */
function resolveSsl(connectionString: string): false | { rejectUnauthorized: boolean } {
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");
  if (isLocal) return false;
  return { rejectUnauthorized: false };
}

declare global {
  // eslint-disable-next-line no-var
  var __baytPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = getDatabaseUrl();
  const pool = new Pool({
    connectionString,
    ssl: resolveSsl(connectionString),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("error", (err) => {
    console.error("[postgres] خطأ غير متوقع في الـ pool:", err.message);
  });

  return pool;
}

/** Singleton pool — يتحمّل HMR في Next dev */
export function getPool(): Pool {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "محاولة استخدام Postgres بدون DATABASE_URL. استخدم mock أو عرّف المتغير.",
    );
  }
  if (!globalThis.__baytPgPool) {
    globalThis.__baytPgPool = createPool();
  }
  return globalThis.__baytPgPool;
}

export class DatabaseError extends Error {
  code?: string;
  cause?: unknown;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message);
    this.name = "DatabaseError";
    this.code = options?.code;
    this.cause = options?.cause;
  }
}

function wrapError(err: unknown, context: string): never {
  if (err instanceof DatabaseError) throw err;

  const pgErr = err as { code?: string; message?: string; detail?: string };
  const code = pgErr?.code;
  const detail = pgErr?.detail ? ` — ${pgErr.detail}` : "";
  const base = pgErr?.message ?? String(err);

  // أخطاء Postgres الشائعة
  if (code === "23505") {
    throw new DatabaseError(`تكرار قيمة فريدة: ${base}${detail}`, {
      code,
      cause: err,
    });
  }
  if (code === "23503") {
    throw new DatabaseError(`مرجع غير موجود (FK): ${base}${detail}`, {
      code,
      cause: err,
    });
  }
  if (code === "42P01") {
    throw new DatabaseError(
      `جدول غير موجود — نفّذ db/schema.sql أولاً. (${base})`,
      { code, cause: err },
    );
  }
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    throw new DatabaseError(
      `تعذّر الاتصال بقاعدة البيانات (${context}): ${base}`,
      { code, cause: err },
    );
  }

  throw new DatabaseError(`خطأ قاعدة البيانات (${context}): ${base}${detail}`, {
    code,
    cause: err,
  });
}

/** استعلام متعدد الصفوف */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  try {
    const result = await getPool().query<T>(text, params);
    return result.rows;
  } catch (err) {
    wrapError(err, "query");
  }
}

/** صف واحد أو null */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** تنفيذ بدون إرجاع صفوف (INSERT/UPDATE/DELETE) */
export async function execute(
  text: string,
  params?: unknown[],
): Promise<number> {
  try {
    const result = await getPool().query(text, params);
    return result.rowCount ?? 0;
  } catch (err) {
    wrapError(err, "execute");
  }
}

/** معاملة آمنة: BEGIN → fn → COMMIT | ROLLBACK */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const value = await fn(client);
    await client.query("COMMIT");
    return value;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* تجاهل فشل الـ rollback */
    }
    wrapError(err, "transaction");
  } finally {
    client.release();
  }
}

/** استعلام داخل معاملة */
export async function clientQuery<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  text: string,
  params?: unknown[],
): Promise<T[]> {
  try {
    const result = await client.query<T>(text, params);
    return result.rows;
  } catch (err) {
    wrapError(err, "clientQuery");
  }
}

export async function clientQueryOne<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await clientQuery<T>(client, text, params);
  return rows[0] ?? null;
}

/** فحص سريع للاتصال (health) */
export async function pingDatabase(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    await query("SELECT 1 AS ok");
    return true;
  } catch (err) {
    console.error("[postgres] ping فشل:", err);
    return false;
  }
}
