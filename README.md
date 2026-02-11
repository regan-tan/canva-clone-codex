# Canva Clone Codex Monorepo

Initialized workspace layout with app, package, and infra boundaries.

## Workspaces

- `apps/web`: Next.js editor and presentation routes.
- `apps/api`: REST API, auth, and export orchestration entrypoint.
- `apps/realtime`: Socket.io room sync service.
- `packages/editor-core`: canvas abstractions, tools, and command model.
- `packages/ui`: shared UI components and design system primitives.
- `packages/realtime-client`: realtime client sync/reconnect utilities.
- `packages/contracts`: zod schemas and shared event types.
- `packages/exporters`: export serialization helpers.
- `infra/`: docker compose, migrations, Redis, storage scaffolding.

## Tooling

- pnpm workspaces
- TypeScript project references (`tsc -b`)
- ESLint + Prettier configuration
