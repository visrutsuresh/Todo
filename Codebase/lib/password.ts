import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

// Split out of auth.ts so it can be imported OUTSIDE a Next request: auth.ts
// pulls in next/headers, which throws anywhere there is no request context.
// The seed script and the unit tests both need hashing without a server.
const KEYLEN = 64;

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
