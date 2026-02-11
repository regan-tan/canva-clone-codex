export function createMetricsRegistry() {
  const timers = new Map();
  const gauges = new Map();

  return {
    observeLatency(name, durationMs, tags = {}) {
      const values = timers.get(name) || [];
      values.push({ durationMs, tags });
      timers.set(name, values);
    },
    setGauge(name, value, tags = {}) {
      gauges.set(name, { value, tags, at: Date.now() });
    },
    snapshot() {
      return {
        latency: Object.fromEntries(timers.entries()),
        gauges: Object.fromEntries(gauges.entries())
      };
    }
  };
}

export function withTimer(registry, metric, tags, fn) {
  const started = performance.now();
  try {
    const value = fn();
    if (value?.then) {
      return value.finally(() => registry.observeLatency(metric, performance.now() - started, tags));
    }
    registry.observeLatency(metric, performance.now() - started, tags);
    return value;
  } catch (error) {
    registry.observeLatency(metric, performance.now() - started, { ...tags, outcome: 'error' });
    throw error;
  }
}
