import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb, newId, nowIso } from './db';

export const SESSION_COOKIE = 'todo_session';
const SESSION_DAYS = 7;
const KEYLEN = 64;

export type User = { id: string; email: string };

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return { hash: scryptSync(password, salt, KEYLEN).toString('hex'), salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, KEYLEN);
  const stored = Buffer.from(hash, 'hex');
  // Length check first: timingSafeEqual throws on mismatched lengths.
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

export function createSession(userId: string): { token: string; expires: Date } {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  getDb()
    .prepare('INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)')
    .run(token, userId, expires.toISOString());
  return { token, expires };
}

export function destroySession(token: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/**
 * Resolves the signed-in user from the session cookie, or null.
 * Expired sessions are deleted on read rather than by a background job.
 * ponytail: no cron needed at this scale; sweep on access is enough.
 */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id AS id, u.email AS email, s.expires AS expires
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`
    )
    .get(token) as { id: string; email: string; expires: string } | undefined;

  if (!row) return null;
  if (new Date(row.expires) < new Date()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, email: row.email };
}

export function createUser(email: string, password: string): User {
  const { hash, salt } = hashPassword(password);
  const id = newId();
  getDb()
    .prepare('INSERT INTO users (id, email, pw_hash, pw_salt, created) VALUES (?, ?, ?, ?, ?)')
    .run(id, email, hash, salt, nowIso());
  return { id, email };
}

export function findUserByEmail(email: string) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: string; email: string; pw_hash: string; pw_salt: string }
    | undefined;
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  };
}
