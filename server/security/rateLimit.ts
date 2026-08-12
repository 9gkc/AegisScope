import { TRPCError } from "@trpc/server";

type RateLimitState = { count: number; resetAt: number };

const buckets = new Map<string, RateLimitState>();

/**
 * Per-instance defence-in-depth limiter for authenticated, sensitive actions.
 * A hosting-edge limiter should complement this if the app scales beyond one instance.
 */
export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Request limit reached. Please wait before trying again.",
    });
  }

  current.count += 1;
  if (buckets.size > 2_000) {
    for (const [bucketKey, state] of Array.from(buckets.entries())) {
      if (state.resetAt <= now) buckets.delete(bucketKey);
    }
  }
}
