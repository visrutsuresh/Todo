import { NextResponse } from 'next/server';
import { createUser, createSession, findUserByEmail, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();
  if (findUserByEmail(normalised)) {
    return NextResponse.json({ message: 'That email is already registered.' }, { status: 409 });
  }

  const user = createUser(normalised, password);
  const { token, expires } = createSession(user.id);

  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
  return res;
}
