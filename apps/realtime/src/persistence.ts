import * as Y from 'yjs';

export interface StoredUpdate {
  seq: number;
  update: Uint8Array;
  timestamp: number;
}

interface DocState {
  doc: Y.Doc;
  snapshotSeq: number;
  snapshot: Uint8Array;
  updates: StoredUpdate[];
  seq: number;
}

export interface SyncResult {
  fullSync: boolean;
  update: Uint8Array;
  fromSeq: number;
  toSeq: number;
}

export class RealtimeDocStore {
  private readonly docs = new Map<string, DocState>();

  constructor(private readonly snapshotInterval = 20) {}

  getDoc(docId: string): Y.Doc {
    return this.ensureDoc(docId).doc;
  }

  applyUpdate(docId: string, update: Uint8Array): StoredUpdate {
    const state = this.ensureDoc(docId);
    Y.applyUpdate(state.doc, update, 'remote');

    const seq = ++state.seq;
    const storedUpdate: StoredUpdate = { seq, update, timestamp: Date.now() };
    state.updates.push(storedUpdate);

    if (seq - state.snapshotSeq >= this.snapshotInterval) {
      state.snapshot = Y.encodeStateAsUpdate(state.doc);
      state.snapshotSeq = seq;
      state.updates = state.updates.filter((entry) => entry.seq > state.snapshotSeq);
    }

    return storedUpdate;
  }

  getMissingUpdates(docId: string, sinceSeq: number): SyncResult {
    const state = this.ensureDoc(docId);
    const latestSeq = state.seq;

    const incremental = state.updates.filter((entry) => entry.seq > sinceSeq);
    const canReplay = sinceSeq >= state.snapshotSeq && incremental.length > 0;

    if (canReplay) {
      const merged = Y.mergeUpdates(incremental.map((entry) => entry.update));
      return {
        fullSync: false,
        update: merged,
        fromSeq: incremental[0].seq,
        toSeq: incremental[incremental.length - 1].seq,
      };
    }

    return {
      fullSync: true,
      update: Y.encodeStateAsUpdate(state.doc),
      fromSeq: state.snapshotSeq,
      toSeq: latestSeq,
    };
  }

  getDiffFromStateVector(docId: string, stateVector?: Uint8Array): SyncResult {
    const state = this.ensureDoc(docId);
    const update = stateVector
      ? Y.encodeStateAsUpdate(state.doc, stateVector)
      : Y.encodeStateAsUpdate(state.doc);

    return {
      fullSync: !stateVector,
      update,
      fromSeq: state.snapshotSeq,
      toSeq: state.seq,
    };
  }

  getCurrentSeq(docId: string): number {
    return this.ensureDoc(docId).seq;
  }

  private ensureDoc(docId: string): DocState {
    const existing = this.docs.get(docId);
    if (existing) {
      return existing;
    }

    const doc = new Y.Doc();
    const initial: DocState = {
      doc,
      snapshot: Y.encodeStateAsUpdate(doc),
      snapshotSeq: 0,
      updates: [],
      seq: 0,
    };
    this.docs.set(docId, initial);
    return initial;
  }
}
