import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, createSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { checkRateLimit, recordFailure, clearRateLimit, rateLimitKey, clientIp, pruneRateLimits } from '@/lib/ratelimit';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  pruneRateLimits();
  const key = rateLimitKey(clientIp(req), email);
  const limit = checkRateLimit(key);

  if (limit.blocked) {
    const mins = Math.ceil(limit.retryAfterSec / 60);
    return NextResponse.json(
      { message: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const user = findUserByEmail(email.trim().toLowerCase());

  // Deliberately identical response for "no such user" and "wrong password".
  // Distinguishing them lets an attacker enumerate registered email addresses.
  const ok = user && verifyPassword(password, user.pw_hash, user.pw_salt);
  if (!ok) {
    recordFailure(key);
    return NextResponse.json({ message: 'Incorrect email or password.' }, { status: 401 });
  }

  clearRateLimit(key);
  const { token, expires } = createSession(user.id);
  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
  return res;
}
