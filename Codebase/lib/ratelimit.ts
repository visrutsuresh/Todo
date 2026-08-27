// ponytail: in-memory sliding window. Single process, so a Map is enough and a
// Redis dependency would be pure overhead here. Known ceiling: state is lost on
// restart and is not shared across instances, so this stops password guessing
// but would not survive horizontal scaling. Swap for Redis if this ever runs on
// more than one process.

type Attempt = { count: number; first: number };

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;

declare global {
  var __todoRateLimit: Map<string, Attempt> | undefined;
}

function store(): Map<string, Attempt> {
  globalThis.__todoRateLimit ??= new Map();
  return globalThis.__todoRateLimit;
}

/**
 * Keyed on IP AND email together, deliberately. Keying on email alone would let
 * anyone lock a victim out of their own account by guessing at it from anywhere
 * (an account-lockout denial of service). Keying on IP alone would punish
 * everyone behind a shared NAT.
 */
export function rateLimitKey(ip: string, email: string): string {
  return `${ip}|${email.trim().toLowerCase()}`;
}

export function checkRateLimit(key: string, now = Date.now()) {
  const rec = store().get(key);

  if (!rec || now - rec.first > WINDOW_MS) {
    return { blocked: false as const, remaining: MAX_FAILURES };
  }
  if (rec.count >= MAX_FAILURES) {
    return {
      blocked: true as const,
      retryAfterSec: Math.ceil((rec.first + WINDOW_MS - now) / 1000),
    };
  }
  return { blocked: false as const, remaining: MAX_FAILURES - rec.count };
}

export function recordFailure(key: string, now = Date.now()): void {
  const rec = store().get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    store().set(key, { count: 1, first: now });
    return;
  }
  rec.count += 1;
}

/** Called on successful login so a legitimate user is never left throttled. */
export function clearRateLimit(key: string): void {
  store().delete(key);
}

/** Opportunistic sweep so the Map cannot grow without bound. */
export function pruneRateLimits(now = Date.now()): void {
  for (const [k, v] of store()) {
    if (now - v.first > WINDOW_MS) store().delete(k);
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}

export const RATE_LIMIT_CONFIG = { WINDOW_MS, MAX_FAILURES };
