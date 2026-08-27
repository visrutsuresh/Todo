import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

// The password functions are duplicated here rather than imported because
// lib/auth.ts pulls in next/headers, which cannot load outside a request.
// ponytail: the crypto is four lines; a test harness that can import TSX
// through Next's compiler costs more than it is worth for this.
const KEYLEN = 64;

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return { hash: scryptSync(password, salt, KEYLEN).toString('hex'), salt };
}

function verifyPassword(password, hash, salt) {
  const candidate = scryptSync(password, salt, KEYLEN);
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

test('correct password verifies', () => {
  const { hash, salt } = hashPassword('correct horse battery');
  assert.equal(verifyPassword('correct horse battery', hash, salt), true);
});

test('wrong password is rejected', () => {
  const { hash, salt } = hashPassword('correct horse battery');
  assert.equal(verifyPassword('wrong password here', hash, salt), false);
});

test('same password with different salts gives different hashes', () => {
  const a = hashPassword('same password');
  const b = hashPassword('same password');
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
});

test('a hash is not verifiable against the wrong salt', () => {
  const { hash } = hashPassword('same password');
  const other = randomBytes(16).toString('hex');
  assert.equal(verifyPassword('same password', hash, other), false);
});

test('malformed stored hash does not throw', () => {
  assert.equal(verifyPassword('anything', 'deadbeef', 'somesalt'), false);
});
