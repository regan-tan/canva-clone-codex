# Infrastructure Scaffold

This folder includes baseline infrastructure assets for local development and deployment orchestration.

## Layout

- `docker/docker-compose.yml`: local service composition (db, redis, storage emulator).
- `db/migrations/`: SQL migrations for schema evolution.
- `redis/redis.conf`: Redis runtime config.
- `storage/storage.env.example`: object storage environment template.
