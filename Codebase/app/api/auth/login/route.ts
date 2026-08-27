import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, createSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  const user = findUserByEmail(email.trim().toLowerCase());

  // Deliberately identical response for "no such user" and "wrong password".
  // Distinguishing them lets an attacker enumerate registered email addresses.
  const ok = user && verifyPassword(password, user.pw_hash, user.pw_salt);
  if (!ok) {
    return NextResponse.json({ message: 'Incorrect email or password.' }, { status: 401 });
  }

  const { token, expires } = createSession(user.id);
  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
  return res;
}
