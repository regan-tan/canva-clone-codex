import { PresenceUpdateEvent } from '../../../packages/contracts/realtime.js';

interface PresenceState {
  event: PresenceUpdateEvent;
  expiresAt: number;
}

export class PresenceTracker {
  private readonly byDoc = new Map<string, Map<string, PresenceState>>();

  constructor(private readonly ttlMs = 30_000) {}

  upsert(event: PresenceUpdateEvent): PresenceUpdateEvent {
    const docMap = this.byDoc.get(event.docId) ?? new Map<string, PresenceState>();
    const expiresAt = Date.now() + this.ttlMs;
    const enriched: PresenceUpdateEvent = { ...event, expiresAt };
    docMap.set(event.userId, { event: enriched, expiresAt });
    this.byDoc.set(event.docId, docMap);
    return enriched;
  }

  sweepExpired(now = Date.now()): PresenceUpdateEvent[] {
    const expired: PresenceUpdateEvent[] = [];

    for (const [docId, users] of this.byDoc.entries()) {
      for (const [userId, state] of users.entries()) {
        if (state.expiresAt <= now) {
          users.delete(userId);
          expired.push({ ...state.event, status: 'offline', expiresAt: now });
        }
      }

      if (users.size === 0) {
        this.byDoc.delete(docId);
      }
    }

    return expired;
  }
}
