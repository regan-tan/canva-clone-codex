export function createErrorMonitor({ logger, tracer }) {
  return {
    capture(error, context = {}) {
      const event = {
        type: 'error',
        name: error.name,
        message: error.message,
        stack: error.stack,
        context
      };
      logger.error('Captured error event', event);
      tracer.annotate('error.captured', { message: error.message, ...context });
      return event;
    }
  };
}
