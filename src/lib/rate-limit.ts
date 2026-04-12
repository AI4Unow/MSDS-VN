// Simple in-memory rate limiter for development
// TODO: Replace with Redis-based rate limiter for production

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number = 60_000
): { success: boolean; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, resetTime: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, resetTime: entry.resetTime };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);
  return { success: true, resetTime: entry.resetTime };
}

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 300_000);
}
