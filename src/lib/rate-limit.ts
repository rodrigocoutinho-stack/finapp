/**
 * In-memory sliding window rate limiter.
 * Works per-instance (resets on cold start in serverless).
 * Sufficient for 100-500 users; use Redis/Upstash for 1000+.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Unique prefix to namespace different limiters (e.g. "ai", "pdf") */
  prefix: string;
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Milliseconds until the oldest request in the window expires */
  retryAfterMs: number;
}

export function checkRateLimit(userId: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const key = `${config.prefix}:${userId}`;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = config.windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/** Pre-configured rate limits */
export const AI_CHAT_LIMIT: RateLimitConfig = {
  prefix: "ai-chat",
  maxRequests: 5,
  windowMs: 60 * 1000, // 5 requests per minute
};

export const PDF_IMPORT_LIMIT: RateLimitConfig = {
  prefix: "pdf-import",
  maxRequests: 2,
  windowMs: 5 * 60 * 1000, // 2 requests per 5 minutes
};
