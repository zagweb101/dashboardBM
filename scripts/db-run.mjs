/**
 * تشغيل schema.sql / seed.sql على PostgreSQL
 *
 * الاستخدام:
 *   DATABASE_URL=... npm run db:schema
 *   DATABASE_URL=... npm run db:seed
 *   DATABASE_URL=... npm run db:setup   # schema ثم seed
 *
 * يعتمد على `psql` في PATH (PostgreSQL client).
 * على Windows: ثبّت PostgreSQL أو استخدم Docker:
 *   docker run --rm -i postgres:16-alpine psql "$DATABASE_URL" < db/schema.sql
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const mode = process.argv[2] || "setup"; // schema | seed | setup
const databaseUrl = (process.env.DATABASE_URL || "").trim();

if (!databaseUrl) {
  console.error("❌ DATABASE_URL غير معرّف.");
  console.error("   مثال: set DATABASE_URL=postgresql://bayt:bayt@localhost:5432/bayt");
  process.exit(1);
}

function runSqlFile(relativePath) {
  const file = resolve(root, relativePath);
  if (!existsSync(file)) {
    console.error(`❌ الملف غير موجود: ${relativePath}`);
    process.exit(1);
  }

  console.log(`→ تنفيذ ${relativePath} ...`);

  // psql -f file DATABASE_URL
  const result = spawnSync(
    "psql",
    [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", file],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    },
  );

  if (result.error) {
    console.error("❌ تعذّر تشغيل psql. تأكد من تثبيته في PATH.");
    console.error("   بديل Docker:");
    console.error(
      `   docker run --rm -i postgres:16-alpine psql "${databaseUrl.replace(/"/g, "")}" < ${relativePath}`,
    );
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`❌ فشل تنفيذ ${relativePath} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }

  console.log(`✓ تم: ${relativePath}`);
}

if (mode === "schema") {
  runSqlFile("db/schema.sql");
} else if (mode === "seed") {
  runSqlFile("db/seed.sql");
} else if (mode === "setup") {
  runSqlFile("db/schema.sql");
  runSqlFile("db/seed.sql");
  console.log("✓ قاعدة البيانات جاهزة (schema + seed)");
} else {
  console.error("الاستخدام: node scripts/db-run.mjs [schema|seed|setup]");
  process.exit(1);
}
