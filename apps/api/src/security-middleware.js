import { assertRole, createRateLimiter, validateSession, verifyJwt } from '../../../packages/auth/src/security.js';
import { createLogger } from '../../../packages/observability/src/logger.js';
import { createMetricsRegistry, withTimer } from '../../../packages/observability/src/metrics.js';

const logger = createLogger({ service: 'api' });
const metrics = createMetricsRegistry();

export function createApiSecurity({ jwtSecret }) {
  const limiter = createRateLimiter({ max: 120, window: '1m' });

  return {
    authorizeRequest(request) {
      return withTimer(metrics, 'api.request.latency', { route: request.route }, () => {
        const rateLimit = limiter.consume(request.ip || 'unknown');
        if (!rateLimit.allowed) {
          logger.warn('rate_limit_blocked', { ip: request.ip, retryAfterMs: rateLimit.retryAfterMs });
          throw new Error('Too many requests');
        }

        const authHeader = request.headers?.authorization || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const user = verifyJwt(token, { secret: jwtSecret });
        const session = validateSession(request.session);
        if (!session.valid) {
          logger.warn('invalid_session', { reason: session.reason });
          throw new Error('Invalid session');
        }

        assertRole(user, request.allowedRoles || ['editor', 'admin']);
        logger.info('request_authorized', { userId: user.sub, route: request.route });
        return { user, rateLimit };
      });
    },
    metricsSnapshot() {
      return metrics.snapshot();
    }
  };
}
