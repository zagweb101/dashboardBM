import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, assertRateLimit, AUTH_RATE_LIMITS } from "@/lib/security/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should allow requests within limit", () => {
    const result = checkRateLimit({ key: "test:1", max: 3, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("should block requests exceeding limit", () => {
    checkRateLimit({ key: "test:2", max: 2, windowMs: 60000 });
    checkRateLimit({ key: "test:2", max: 2, windowMs: 60000 });
    const result = checkRateLimit({ key: "test:2", max: 2, windowMs: 60000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should reset after window expires", () => {
    checkRateLimit({ key: "test:3", max: 1, windowMs: 1000 });
    const blocked = checkRateLimit({ key: "test:3", max: 1, windowMs: 1000 });
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    const allowed = checkRateLimit({ key: "test:3", max: 1, windowMs: 1000 });
    expect(allowed.allowed).toBe(true);
  });

  it("should track different keys independently", () => {
    checkRateLimit({ key: "a", max: 1, windowMs: 60000 });
    const result = checkRateLimit({ key: "b", max: 1, windowMs: 60000 });
    expect(result.allowed).toBe(true);
  });

  it("assertRateLimit should throw when exceeded", () => {
    assertRateLimit({ key: "assert:1", max: 1, windowMs: 60000 });
    expect(() => assertRateLimit({ key: "assert:1", max: 1, windowMs: 60000 })).toThrow("RATE_LIMITED");
  });

  it("assertRateLimit should not throw when within limit", () => {
    expect(() => assertRateLimit({ key: "assert:2", max: 5, windowMs: 60000 })).not.toThrow();
  });

  it("should have correct auth presets", () => {
    expect(AUTH_RATE_LIMITS.login.max).toBe(5);
    expect(AUTH_RATE_LIMITS.register.max).toBe(3);
    expect(AUTH_RATE_LIMITS.forgotPassword.max).toBe(3);
  });
});
