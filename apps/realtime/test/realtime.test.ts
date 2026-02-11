import * as Y from 'yjs';
import { describe, expect, it } from 'vitest';
import { PresenceTracker } from '../src/presence.js';
import { RealtimeDocStore } from '../src/persistence.js';

describe('RealtimeDocStore', () => {
  it('merges concurrent updates conflict-free', () => {
    const base = new Y.Doc();
    const seed = base.getText('content');
    seed.insert(0, 'hello');

    const update = Y.encodeStateAsUpdate(base);

    const aliceDoc = new Y.Doc();
    const bobDoc = new Y.Doc();
    Y.applyUpdate(aliceDoc, update);
    Y.applyUpdate(bobDoc, update);

    aliceDoc.getText('content').insert(5, ' alice');
    bobDoc.getText('content').insert(5, ' bob');

    const store = new RealtimeDocStore();
    store.applyUpdate('doc-1', Y.encodeStateAsUpdate(aliceDoc));
    store.applyUpdate('doc-1', Y.encodeStateAsUpdate(bobDoc));

    const mergedDoc = store.getDoc('doc-1');
    const value = mergedDoc.getText('content').toString();

    expect(value).toContain('hello');
    expect(value).toContain('alice');
    expect(value).toContain('bob');
  });

  it('replays missed updates on reconnect when sequence window exists', () => {
    const store = new RealtimeDocStore(100);
    const doc = new Y.Doc();
    const text = doc.getText('content');

    text.insert(0, 'a');
    store.applyUpdate('doc-2', Y.encodeStateAsUpdate(doc));

    text.insert(1, 'b');
    store.applyUpdate('doc-2', Y.encodeStateAsUpdate(doc));

    text.insert(2, 'c');
    store.applyUpdate('doc-2', Y.encodeStateAsUpdate(doc));

    const replay = store.getMissingUpdates('doc-2', 1);
    expect(replay.fullSync).toBe(false);
    expect(replay.fromSeq).toBe(2);
    expect(replay.toSeq).toBe(3);

    const recovered = new Y.Doc();
    const initial = store.getMissingUpdates('doc-2', 0);
    Y.applyUpdate(recovered, initial.update);
    Y.applyUpdate(recovered, replay.update);

    expect(recovered.getText('content').toString()).toContain('abc');
  });
});

describe('PresenceTracker', () => {
  it('expires presence entries after TTL and emits offline updates', async () => {
    const tracker = new PresenceTracker(10);
    tracker.upsert({ docId: 'doc-presence', userId: 'u1', status: 'online' });

    const expired = tracker.sweepExpired(Date.now() + 20);
    expect(expired).toHaveLength(1);
    expect(expired[0].status).toBe('offline');
    expect(expired[0].docId).toBe('doc-presence');
  });
});
