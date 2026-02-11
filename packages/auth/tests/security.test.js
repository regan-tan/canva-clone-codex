import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { assertRole, createRateLimiter, validateSession, verifyJwt } from '../src/security.js';

function makeToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

test('verifyJwt validates signature and expiration', () => {
  const secret = 's3cr3t';
  const token = makeToken({ sub: 'user-1', roles: ['editor'], exp: Math.floor(Date.now() / 1000) + 120 }, secret);

  const payload = verifyJwt(token, { secret });
  assert.equal(payload.sub, 'user-1');
});

test('validateSession rejects expired session', () => {
  const session = { userId: 'u1', expiresAt: '2020-01-01T00:00:00.000Z' };
  const result = validateSession(session, { now: Date.now() });
  assert.equal(result.valid, false);
});

test('assertRole allows scoped access', () => {
  assert.equal(assertRole({ roles: ['viewer', 'editor'] }, ['editor']), true);
  assert.throws(() => assertRole({ roles: ['viewer'] }, ['admin']));
});

test('rate limiter blocks after threshold', () => {
  const limiter = createRateLimiter({ max: 2, window: '1m' });
  assert.equal(limiter.consume('1.1.1.1').allowed, true);
  assert.equal(limiter.consume('1.1.1.1').allowed, true);
  assert.equal(limiter.consume('1.1.1.1').allowed, false);
});
