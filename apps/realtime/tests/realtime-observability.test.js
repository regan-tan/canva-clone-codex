import test from 'node:test';
import assert from 'node:assert/strict';
import { createRealtimeObservability } from '../src/realtime-observability.js';

test('integration: realtime observability tracks room size and sync lag', async () => {
  const obs = createRealtimeObservability();
  obs.onSocketJoin('room-1', 3);
  const result = await obs.trackSyncLag('room-1', async () => 'ok');
  assert.equal(result, 'ok');

  const snapshot = obs.snapshot();
  assert.equal(snapshot.gauges['socket.room.size'].value, 3);
  assert.equal(snapshot.latency['sync.lag.ms'].length, 1);
});

test('integration: export monitoring captures failure', async () => {
  const obs = createRealtimeObservability();
  await assert.rejects(() => obs.trackExportDuration('exp-1', async () => {
    throw new Error('export failed');
  }));

  const snapshot = obs.snapshot();
  assert.equal(snapshot.latency['export.duration.ms'].length, 1);
});
