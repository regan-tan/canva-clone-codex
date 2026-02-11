# Testing Tiers

- **Unit tests (`packages/*`)**: core authentication and observability primitives.
- **Integration tests (`apps/api`, `apps/realtime`)**: API auth middleware and realtime pipelines.
- **E2E tests (`apps/web`)**: collaboration flow behavior covering presence and revision propagation.

Run all tiers with:

```bash
npm test
```
