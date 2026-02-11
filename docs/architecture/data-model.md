# Data Model (Core Entities)

This document defines the core entities for collaborative design editing, comments, assets, and export workflows.

## 1) Workspace
Represents a top-level collaborative boundary (team/project space).

**Key fields**
- `id` (UUID)
- `name`
- `ownerUserId`
- `settings` (JSONB: plan/features/default roles)
- `createdAt`, `updatedAt`

**Relationships**
- One workspace has many documents.
- One workspace has many members (via membership table).

## 2) Document
Represents a single editable file/canvas project.

**Key fields**
- `id` (UUID)
- `workspaceId` (FK)
- `title`
- `status` (active/archived)
- `currentVersion` (monotonic integer or semantic snapshot ref)
- `crdtSnapshotRef` (object-storage key or DB pointer)
- `createdBy`, `updatedBy`
- `createdAt`, `updatedAt`

**Relationships**
- Belongs to one workspace.
- Has many pages/slides.
- Has many comment threads.
- Has many assets (directly or by usage links).
- Has many export jobs.

## 3) Page / Slide
Represents an ordered frame/artboard in a document.

**Key fields**
- `id` (UUID)
- `documentId` (FK)
- `type` (`page` or `slide`)
- `name`
- `index` (ordering)
- `width`, `height`
- `background` (color/image ref)
- `createdAt`, `updatedAt`

**Relationships**
- Belongs to one document.
- Contains many elements.

## 4) Element
Represents a drawable/editable node (text, shape, image, group, frame, etc.).

**Key fields**
- `id` (UUID)
- `documentId` (FK)
- `pageId` (FK)
- `parentElementId` (nullable FK for group/layer tree)
- `type` (text/shape/image/vector/group/frame)
- `transform` (JSONB: x, y, scale, rotation)
- `style` (JSONB: fill, stroke, effects, typography)
- `content` (JSONB: text runs or vector path data)
- `zIndex`
- `locked`, `visible`
- `createdAt`, `updatedAt`

**Notes**
- Structural state is synchronized via CRDT fields/collections.
- Heavy immutable payloads (for example original image binary) are referenced via `assetId`.

## 5) Comment Thread
Represents anchored discussions on document/page/element scope.

**Key fields**
- `id` (UUID)
- `documentId` (FK)
- `pageId` (nullable FK)
- `elementId` (nullable FK)
- `anchor` (JSONB: coordinates/range reference)
- `status` (open/resolved)
- `createdBy`
- `createdAt`, `updatedAt`

**Child entity**
- `comment_messages` (threaded messages with author/body/timestamps).

## 6) User Presence
Represents ephemeral collaboration state for active sessions.

**Key fields**
- `sessionId`
- `userId`
- `workspaceId`
- `documentId`
- `cursor` (x, y)
- `selection` (array of element IDs)
- `viewport` (zoom, pan)
- `tool`
- `lastSeenAt`
- `ttlExpiresAt`

**Storage guidance**
- Primary home is Redis/in-memory room state with TTL.
- Optional audit snapshots (if needed) should be sampled and stored separately from live presence.

## 7) Asset
Represents binary files used by documents (uploads, embeds, generated media).

**Key fields**
- `id` (UUID)
- `workspaceId` (FK)
- `documentId` (nullable FK)
- `kind` (image/video/font/audio/other)
- `storageKey` (S3 object key)
- `mimeType`
- `sizeBytes`
- `checksum`
- `width`, `height`, `durationMs` (nullable media metadata)
- `createdBy`
- `createdAt`

**Relationships**
- Can be referenced by many elements.
- Can be source input for export jobs.

## 8) Export Job
Represents asynchronous render/export operations.

**Key fields**
- `id` (UUID)
- `documentId` (FK)
- `requestedBy`
- `format` (png/jpeg/pdf/svg/mp4/...)
- `params` (JSONB: quality, page range, scale, transparent bg)
- `status` (queued/running/succeeded/failed/canceled)
- `progress` (0-100)
- `resultAssetId` (nullable FK to generated asset)
- `errorCode`, `errorMessage` (nullable)
- `createdAt`, `startedAt`, `finishedAt`

**Lifecycle**
- Created by API, consumed by worker queue, updated throughout execution.
- On success, links to output asset and emits `export:status` realtime updates.

## Cross-cutting modeling notes
- Use UUIDs for globally unique identifiers across services.
- Keep transactional metadata in Postgres; keep high-churn ephemeral state (presence) in Redis.
- Store large blobs in S3-compatible object storage; keep only references and searchable metadata in Postgres.
- Include soft-delete or archival fields where product requirements need restore/history workflows.
