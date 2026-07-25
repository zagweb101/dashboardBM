/**
 * تشفير والتحقق من كلمات المرور (bcrypt)
 */
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/** رمز إعادة تعيين كلمة المرور (يُخزَّن مشفّراً في verification_token) */
export function generateResetToken(): { raw: string; hashed: string } {
  const raw = randomBytes(32).toString("hex");
  const hashed = hashToken(raw);
  return { raw, hashed };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
