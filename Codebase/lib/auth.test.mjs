import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from './password.ts';

// Imports the real hashing code. It used to be duplicated here because auth.ts
// pulls in next/headers and cannot load outside a request; splitting hashing
// into password.ts removed the copy, so the test now exercises what ships.

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
