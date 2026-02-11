import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createApiSecurity } from '../src/security-middleware.js';

function tokenFor(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

test('integration: api security authorizes valid request', () => {
  const secret = 'integration-secret';
  const security = createApiSecurity({ jwtSecret: secret });
  const token = tokenFor({ sub: 'u1', roles: ['editor'], exp: Math.floor(Date.now() / 1000) + 3600 }, secret);

  const result = security.authorizeRequest({
    ip: '10.0.0.1',
    route: '/documents/123',
    headers: { authorization: `Bearer ${token}` },
    session: { userId: 'u1', expiresAt: '2999-01-01T00:00:00.000Z' },
    allowedRoles: ['editor']
  });

  assert.equal(result.user.sub, 'u1');
});

test('integration: api security blocks invalid role', () => {
  const secret = 'integration-secret';
  const security = createApiSecurity({ jwtSecret: secret });
  const token = tokenFor({ sub: 'u2', roles: ['viewer'], exp: Math.floor(Date.now() / 1000) + 3600 }, secret);

  assert.throws(() =>
    security.authorizeRequest({
      ip: '10.0.0.2',
      route: '/admin',
      headers: { authorization: `Bearer ${token}` },
      session: { userId: 'u2', expiresAt: '2999-01-01T00:00:00.000Z' },
      allowedRoles: ['admin']
    })
  );
});
