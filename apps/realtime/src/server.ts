import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, type ServerOptions } from 'socket.io';
import {
  type AuthPayload,
  type ClientToServerEvents,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '../../../packages/contracts/realtime.js';
import { PresenceTracker } from './presence.js';
import { RealtimeDocStore } from './persistence.js';

export interface RealtimeServerConfig {
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  verifyToken: (token: string) => Promise<{ userId: string } | null>;
  redisUrl?: string;
  snapshotInterval?: number;
  presenceTtlMs?: number;
}

export async function setupRealtimeServer(config: RealtimeServerConfig): Promise<void> {
  const { io, verifyToken } = config;
  const store = new RealtimeDocStore(config.snapshotInterval);
  const presence = new PresenceTracker(config.presenceTtlMs);

  if (config.redisUrl) {
    const pubClient = new Redis(config.redisUrl);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.use(async (socket, next) => {
    const auth = socket.handshake.auth as AuthPayload | undefined;
    if (!auth?.token) {
      next(new Error('Missing auth token'));
      return;
    }

    const user = await verifyToken(auth.token);
    if (!user) {
      next(new Error('Unauthorized'));
      return;
    }

    socket.data.userId = user.userId;
    next();
  });

  io.on('connection', (socket) => {
    socket.on('joinDoc', ({ docId }) => {
      socket.join(docId);
    });

    socket.on('leaveDoc', ({ docId }) => {
      socket.leave(docId);
    });

    socket.on('doc:update', (event) => {
      const stored = store.applyUpdate(event.docId, event.update);
      io.to(event.docId).emit('doc:update', { ...event, seq: stored.seq });
    });

    socket.on('doc:sync-request', (event) => {
      const sync =
        typeof event.sinceSeq === 'number'
          ? store.getMissingUpdates(event.docId, event.sinceSeq)
          : store.getDiffFromStateVector(event.docId, event.stateVector);

      socket.emit('doc:sync-response', {
        docId: event.docId,
        ...sync,
      });
    });

    socket.on('presence:update', (event) => {
      const enriched = presence.upsert(event);
      io.to(event.docId).emit('presence:update', enriched);
    });

    socket.on('cursor:update', (event) => {
      socket.to(event.docId).emit('cursor:update', event);
    });

    socket.on('comment:create', (event) => {
      io.to(event.docId).emit('comment:create', event);
    });

    socket.on('comment:update', (event) => {
      io.to(event.docId).emit('comment:update', event);
    });

    socket.on('comment:resolve', (event) => {
      io.to(event.docId).emit('comment:resolve', event);
    });
  });

  setInterval(() => {
    for (const expired of presence.sweepExpired()) {
      io.to(expired.docId).emit('presence:update', expired);
    }
  }, 1_000).unref();
}

export function createIoServer(options?: Partial<ServerOptions>) {
  return new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(options);
}
