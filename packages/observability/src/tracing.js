let spanCounter = 0;

export function createTracer({ service, logger }) {
  return {
    startSpan(name, attributes = {}) {
      const spanId = `${service}-${++spanCounter}`;
      const startedAt = Date.now();
      logger.debug('span.start', { spanId, name, attributes });

      return {
        spanId,
        end(extra = {}) {
          const durationMs = Date.now() - startedAt;
          logger.debug('span.end', { spanId, name, durationMs, ...extra });
          return { spanId, name, durationMs };
        }
      };
    },
    annotate(event, attributes = {}) {
      logger.debug('span.annotation', { event, attributes });
    }
  };
}
