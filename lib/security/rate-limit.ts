/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance deployments (Railway single container).
 * For multi-instance: swap with Upstash Redis or similar.
 */

type WindowEntry = { count: number; resetAt: number };

const store = new Map<string, WindowEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Unique key (e.g. IP + endpoint) */
  key: string;
  /** Maximum requests per window */
  max: number;
  /** Window duration in milliseconds (default: 60 000 = 1 min) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check + increment rate limit counter.
 * Returns whether the request is allowed.
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  cleanup();

  const { key, max, windowMs = 60_000 } = config;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  entry.count += 1;
  const remaining = Math.max(0, max - entry.count);
  return { allowed: entry.count <= max, remaining, resetAt: entry.resetAt };
}

/**
 * Convenience: check rate limit and throw if exceeded.
 */
export function assertRateLimit(config: RateLimitConfig): void {
  const result = checkRateLimit(config);
  if (!result.allowed) {
    const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000);
    throw new Error(
      `RATE_LIMITED: Too many requests. Retry after ${retryAfterSec}s.`,
    );
  }
}

/** Preset configs for auth endpoints */
export const AUTH_RATE_LIMITS = {
  login: { max: 5, windowMs: 60_000 },       // 5 attempts / min
  register: { max: 3, windowMs: 300_000 },    // 3 / 5 min
  forgotPassword: { max: 3, windowMs: 300_000 }, // 3 / 5 min
} as const;
