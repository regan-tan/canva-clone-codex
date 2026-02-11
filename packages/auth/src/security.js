import { createHmac, timingSafeEqual } from 'node:crypto';

function parseDurationMs(input) {
  if (!input) return 0;
  if (typeof input === 'number') return input;
  const [, amount, unit] = String(input).match(/^(\d+)(ms|s|m|h)$/) || [];
  const value = Number(amount);
  const units = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
  return value * (units[unit] || 0);
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='), 'base64').toString('utf8');
}

export function verifyJwt(token, { secret, now = Date.now() }) {
  if (!token || typeof token !== 'string') throw new Error('Missing token');
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('Malformed token');

  const signed = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac('sha256', secret).update(signed).digest('base64url');
  if (!timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSig))) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(decodeBase64Url(payloadB64));
  if (payload.exp && now >= payload.exp * 1000) throw new Error('Token expired');
  if (payload.nbf && now < payload.nbf * 1000) throw new Error('Token not active');
  return payload;
}

export function validateSession(session, { now = Date.now() } = {}) {
  if (!session || typeof session !== 'object') return { valid: false, reason: 'missing' };
  if (!session.userId) return { valid: false, reason: 'missing_user' };
  if (session.expiresAt && now >= new Date(session.expiresAt).getTime()) return { valid: false, reason: 'expired' };
  return { valid: true, reason: 'ok' };
}

export function assertRole(user, allowedRoles) {
  if (!user || !Array.isArray(user.roles)) throw new Error('User roles missing');
  const match = user.roles.some((role) => allowedRoles.includes(role));
  if (!match) throw new Error('Forbidden');
  return true;
}

export function createRateLimiter({ max = 60, window = '1m' } = {}) {
  const windowMs = parseDurationMs(window);
  const counters = new Map();

  return {
    consume(key, now = Date.now()) {
      const current = counters.get(key) ?? { count: 0, resetAt: now + windowMs };
      if (now >= current.resetAt) {
        current.count = 0;
        current.resetAt = now + windowMs;
      }

      if (current.count >= max) {
        return { allowed: false, retryAfterMs: current.resetAt - now };
      }

      current.count += 1;
      counters.set(key, current);
      return { allowed: true, remaining: max - current.count, resetAt: current.resetAt };
    },
    size() {
      return counters.size;
    }
  };
}
