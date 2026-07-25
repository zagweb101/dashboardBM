import { describe, it, expect } from "vitest";
import {
  generateTempPassword,
  validatePasswordStrength,
} from "@/lib/security/temp-password";

describe("Temp Password Generator", () => {
  it("should generate a 16-character password", () => {
    const pw = generateTempPassword();
    expect(pw.length).toBe(16);
  });

  it("should generate unique passwords", () => {
    const passwords = new Set(Array.from({ length: 100 }, () => generateTempPassword()));
    expect(passwords.size).toBe(100);
  });

  it("should only contain allowed characters", () => {
    const pw = generateTempPassword();
    expect(pw).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("should not contain ambiguous characters (0, O, l, I)", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateTempPassword();
      expect(pw).not.toMatch(/[0OlI]/);
    }
  });
});

describe("Password Strength Validation", () => {
  it("should accept a strong password", () => {
    expect(validatePasswordStrength("MyPass123")).toEqual({ valid: true });
  });

  it("should reject short passwords", () => {
    const result = validatePasswordStrength("Ab1");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 8");
  });

  it("should reject passwords without uppercase", () => {
    expect(validatePasswordStrength("mypassword1").valid).toBe(false);
  });

  it("should reject passwords without lowercase", () => {
    expect(validatePasswordStrength("MYPASSWORD1").valid).toBe(false);
  });

  it("should reject passwords without numbers", () => {
    expect(validatePasswordStrength("MyPassword").valid).toBe(false);
  });

  it("should reject passwords longer than 128 characters", () => {
    const longPw = "A".repeat(121) + "b1234567";
    expect(validatePasswordStrength(longPw).valid).toBe(false);
  });
});
