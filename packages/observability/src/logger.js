export function createLogger({ service }) {
  function log(level, message, context = {}) {
    const payload = {
      ts: new Date().toISOString(),
      service,
      level,
      message,
      ...context
    };
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return payload;
  }

  return {
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
    debug: (message, context) => log('debug', message, context)
  };
}
