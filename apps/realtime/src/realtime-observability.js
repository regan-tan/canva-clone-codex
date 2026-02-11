import { createLogger } from '../../../packages/observability/src/logger.js';
import { createMetricsRegistry, withTimer } from '../../../packages/observability/src/metrics.js';
import { createErrorMonitor } from '../../../packages/observability/src/monitoring.js';
import { createTracer } from '../../../packages/observability/src/tracing.js';

export function createRealtimeObservability() {
  const logger = createLogger({ service: 'realtime' });
  const tracer = createTracer({ service: 'realtime', logger });
  const metrics = createMetricsRegistry();
  const monitor = createErrorMonitor({ logger, tracer });

  return {
    onSocketJoin(roomId, size) {
      metrics.setGauge('socket.room.size', size, { roomId });
      logger.info('socket_room_size_updated', { roomId, size });
    },
    async trackSyncLag(roomId, action) {
      return withTimer(metrics, 'sync.lag.ms', { roomId }, async () => {
        const span = tracer.startSpan('sync.operation', { roomId });
        try {
          const result = await action();
          span.end({ outcome: 'ok' });
          return result;
        } catch (error) {
          span.end({ outcome: 'error' });
          monitor.capture(error, { roomId, pipeline: 'realtime_sync' });
          throw error;
        }
      });
    },
    async trackExportDuration(exportId, action) {
      return withTimer(metrics, 'export.duration.ms', { exportId }, async () => {
        const span = tracer.startSpan('export.pipeline', { exportId });
        try {
          const result = await action();
          span.end({ outcome: 'ok' });
          return result;
        } catch (error) {
          span.end({ outcome: 'error' });
          monitor.capture(error, { exportId, pipeline: 'export' });
          throw error;
        }
      });
    },
    snapshot() {
      return metrics.snapshot();
    }
  };
}
