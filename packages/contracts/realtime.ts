export type RealtimeDocId = string;
export type UserId = string;

export interface AuthPayload {
  token: string;
}

export interface DocUpdateEvent {
  docId: RealtimeDocId;
  update: Uint8Array;
  clientId: string;
  seq?: number;
}

export interface DocSyncRequestEvent {
  docId: RealtimeDocId;
  stateVector?: Uint8Array;
  sinceSeq?: number;
}

export interface DocSyncResponseEvent {
  docId: RealtimeDocId;
  fullSync: boolean;
  update: Uint8Array;
  fromSeq: number;
  toSeq: number;
}

export interface PresenceUpdateEvent {
  docId: RealtimeDocId;
  userId: UserId;
  status: 'online' | 'offline' | 'away';
  metadata?: Record<string, unknown>;
  expiresAt?: number;
}

export interface CursorUpdateEvent {
  docId: RealtimeDocId;
  userId: UserId;
  x: number;
  y: number;
  selection?: { anchor: number; head: number };
}

export interface CommentCreateEvent {
  docId: RealtimeDocId;
  commentId: string;
  authorId: UserId;
  body: string;
  createdAt: number;
}

export interface CommentUpdateEvent {
  docId: RealtimeDocId;
  commentId: string;
  editorId: UserId;
  body: string;
  updatedAt: number;
}

export interface CommentResolveEvent {
  docId: RealtimeDocId;
  commentId: string;
  resolverId: UserId;
  resolvedAt: number;
}

export interface ClientToServerEvents {
  joinDoc: (payload: { docId: RealtimeDocId }) => void;
  leaveDoc: (payload: { docId: RealtimeDocId }) => void;
  'doc:update': (payload: DocUpdateEvent) => void;
  'doc:sync-request': (payload: DocSyncRequestEvent) => void;
  'presence:update': (payload: PresenceUpdateEvent) => void;
  'cursor:update': (payload: CursorUpdateEvent) => void;
  'comment:create': (payload: CommentCreateEvent) => void;
  'comment:update': (payload: CommentUpdateEvent) => void;
  'comment:resolve': (payload: CommentResolveEvent) => void;
}

export interface ServerToClientEvents {
  'doc:update': (payload: DocUpdateEvent) => void;
  'doc:sync-response': (payload: DocSyncResponseEvent) => void;
  'presence:update': (payload: PresenceUpdateEvent) => void;
  'cursor:update': (payload: CursorUpdateEvent) => void;
  'comment:create': (payload: CommentCreateEvent) => void;
  'comment:update': (payload: CommentUpdateEvent) => void;
  'comment:resolve': (payload: CommentResolveEvent) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: UserId;
}
