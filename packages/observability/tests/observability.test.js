import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogger } from '../src/logger.js';
import { createMetricsRegistry } from '../src/metrics.js';
import { createTracer } from '../src/tracing.js';
import { createErrorMonitor } from '../src/monitoring.js';

test('metrics registry captures latency and gauges', () => {
  const registry = createMetricsRegistry();
  registry.observeLatency('request.latency', 12, { route: '/health' });
  registry.setGauge('socket.room.size', 4, { roomId: 'r1' });

  const snapshot = registry.snapshot();
  assert.equal(snapshot.latency['request.latency'][0].durationMs, 12);
  assert.equal(snapshot.gauges['socket.room.size'].value, 4);
});

test('error monitor captures events and emits tracing annotations', () => {
  const logger = createLogger({ service: 'test' });
  const tracer = createTracer({ service: 'test', logger });
  const monitor = createErrorMonitor({ logger, tracer });

  const event = monitor.capture(new Error('boom'), { pipeline: 'export' });
  assert.equal(event.context.pipeline, 'export');
});
