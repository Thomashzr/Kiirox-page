/**
 * In-memory sliding window rate limiter for V1 hardening.
 * Does not require external Redis for V1, conforming to .docs/05-SECURITY.md.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = store.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    store.set(identifier, record);
  }

  // Filter out timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0];
    const reset = Math.ceil((oldest + options.windowMs - now) / 1000);
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: Math.max(1, reset),
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.timestamps.length,
    reset: Math.ceil(options.windowMs / 1000),
  };
}
