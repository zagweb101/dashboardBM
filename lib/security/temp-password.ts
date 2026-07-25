/**
 * Secure random temporary password generator.
 * Used when inviting team members.
 */
import { randomBytes } from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const LENGTH = 16;

/**
 * Generate a cryptographically random temporary password.
 * Contains uppercase, lowercase, and digits. No ambiguous characters (0/O, 1/l/I).
 */
export function generateTempPassword(): string {
  const bytes = randomBytes(LENGTH);
  let result = "";
  for (let i = 0; i < LENGTH; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

/** Minimum password strength requirements */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password must be at most 128 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  return { valid: true };
}
