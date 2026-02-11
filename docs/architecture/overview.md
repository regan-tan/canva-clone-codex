# Architecture Overview

## System topology (text diagram)

```text
┌───────────────────────────────────── Client Tier ──────────────────────────────────────┐
│  Next.js + React App                                                                   │
│  - Rendering + editor engine (canvas, tools, timeline, inspector)                      │
│  - Local CRDT replica + optimistic UI                                                   │
│  - Presence publisher/subscriber (cursor, selection, viewport)                         │
└───────────────┬───────────────────────────────┬─────────────────────────────────────────┘
                │ HTTPS (/api/v1/...)            │ WebSocket (Socket.io)
                │                                │
        ┌───────▼───────────────────────┐  ┌─────▼─────────────────────────────────┐
        │ API Service (Express)         │  │ Realtime Gateway (Socket.io)          │
        │ - AuthN/AuthZ                 │  │ - Room lifecycle + membership          │
        │ - Document/project CRUD       │  │ - CRDT update fanout                   │
        │ - Asset metadata + exports    │  │ - Presence fanout (ephemeral)          │
        │ - Job orchestration           │  │ - Backpressure + rate limiting         │
        └───────┬───────────────┬───────┘  └───────┬───────────────────┬────────────┘
                │               │                  │                   │
      ┌─────────▼──────┐  ┌─────▼─────────────┐  ┌▼─────────────────┐ ┌▼────────────────┐
      │ PostgreSQL     │  │ S3-compatible     │  │ Redis            │ │ Worker(s)       │
      │ - source of    │  │ object storage    │  │ - presence cache │ │ - export/render │
      │   truth        │  │ - binary assets   │  │ - pub/sub        │ │ - async jobs    │
      │ - metadata     │  │ - snapshots       │  │ - short-lived    │ │ - retries       │
      └────────────────┘  └───────────────────┘  └───────────────────┘ └────────┬───────┘
                                                                                 │
                                                                        ┌────────▼─────────┐
                                                                        │ S3/Postgres      │
                                                                        │ export artifacts │
                                                                        └──────────────────┘
```

## Separation of concerns

### 1) Rendering and editor engine
- Runs entirely in the frontend (Next.js/React) to keep interactions low-latency.
- Maintains a local, materialized scene graph for frame-perfect rendering.
- Applies incoming collaborative changes to local state through a CRDT adapter.
- Owns UX-only concerns: snapping, guides, keyboard shortcuts, selection model, and transient tool state.

### 2) Collaboration sync
- Realtime gateway handles WebSocket session lifecycle, room membership, and event fanout.
- Canonical collaboration protocol is event-driven (`doc:update`, `presence:update`, etc.) with strict payload schemas.
- CRDT ops are validated, ordered per document room, and rebroadcast to peers.
- Presence messages are kept out of durable stores by default (ephemeral in Redis + in-memory room state).

### 3) Persistence and export pipelines
- API service persists document metadata, ownership, ACLs, comments, and job state in Postgres.
- Binary assets (images, uploads, generated exports) are stored in S3-compatible storage.
- Periodic CRDT snapshots and compaction metadata are persisted for fast document load/recovery.
- Export pipeline runs asynchronously via workers, writing artifacts + status updates back to storage and DB.

## CRDT decision and conflict resolution

### Preferred choice: **Yjs**
Yjs is the default recommendation for this architecture due to mature performance characteristics in high-frequency collaborative editing and a rich ecosystem for editor bindings.

### Why CRDT over OT in this system
- Offline-first behavior is simpler: clients can merge changes without central transformation history.
- Peer updates are commutative and eventually consistent under intermittent connectivity.
- Reduces server complexity for transform logic and operation rebasing at scale.

### Trade-offs: Yjs vs Automerge
- **Yjs pros**: smaller wire payloads in many practical workloads, strong ecosystem/adapters, battle-tested in editor scenarios.
- **Yjs cons**: internal data model is less human-readable; debugging raw updates can be harder.
- **Automerge pros**: strong developer ergonomics for JSON-like state and clear conceptual model.
- **Automerge cons**: can have higher memory/CPU overhead depending on workload and document shape.

### Trade-offs: CRDT vs OT
- **CRDT pros**: eventual convergence without central sequencer guarantees, robust offline edits, simplified multi-region architecture.
- **CRDT cons**: tombstone/metadata growth requires snapshotting + compaction strategy.
- **OT pros**: lower metadata overhead in some linear text scenarios; historically common in collaborative editors.
- **OT cons**: transform correctness is complex for rich object graphs and can centralize operational dependency.

### Conflict-resolution model
- Last-writer-wins is **not** used for structural document state.
- CRDT merge semantics resolve concurrent inserts/updates deterministically at field/collection level.
- Application-level invariants (e.g., z-index uniqueness, locked elements) are enforced via deterministic post-merge normalization rules.
- Durable checkpoints are produced through periodic snapshots and operation compaction.

## Presence and cursor propagation strategy

- Presence is transmitted on **ephemeral channels** (Socket.io rooms keyed by workspace/document).
- Payload includes cursor coordinates, selected element IDs, tool mode, and viewport, with sequence number + client timestamp.
- Presence records are mirrored to Redis with short **TTL** (for example 15-30 seconds) so stale sessions auto-expire.
- Clients send heartbeats and movement updates at throttled intervals (for example 20-50 ms for cursor movement, 1-2 s for heartbeat).
- Gateway applies server-side throttling/debouncing to protect rooms from bursty clients.
- Disconnect events immediately broadcast `presence:leave`; TTL fallback handles ungraceful disconnects.

## API and event contract conventions

### Versioned REST API
- All HTTP endpoints are namespaced under `/api/v1/...`.
- Breaking changes require a new version namespace (`/api/v2/...`) with migration period.
- Example route groups:
  - `/api/v1/workspaces`
  - `/api/v1/documents`
  - `/api/v1/assets`
  - `/api/v1/exports`

### Realtime event naming
Use `<domain>:<action>` naming with stable, versioned payload schemas.

Core events:
- `doc:join`
- `doc:leave`
- `doc:update`
- `doc:snapshot`
- `presence:update`
- `presence:leave`
- `comment:create`
- `comment:update`
- `asset:uploaded`
- `export:requested`
- `export:status`

Recommended envelope fields for every realtime message:
- `event`: string event name
- `version`: contract version (for example `1`)
- `documentId`: target document context
- `actorId`: user/session identifier
- `timestamp`: server or client ISO timestamp
- `payload`: event-specific data
