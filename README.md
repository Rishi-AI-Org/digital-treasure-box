# DTB21

DTB21 is a private-first personal taste cabinet. Creators log in, curate up to 21 visible items, and keep everything else in a private searchable archive. Viewers receive unguessable, non-indexed cabinet links with no likes, ads, follower counts, or public discovery.

## Repository Layout

- `apps/web`: Next.js web app for the dashboard, capture review, archive, and public cabinet.
- `apps/mobile`: Minimal Expo app scaffold for native share-sheet capture.
- `apps/extension-chrome`: Chrome Manifest V3 extension for browser clipping.
- `services/worker`: Cloudflare Worker-style capture processor.
- `packages/core`: URL parsing, provider adapters, cabinet rules, and shared domain logic.
- `packages/api`: Shared API request/response types.
- `packages/ui`: Small shared React UI primitives.
- `supabase/migrations`: Postgres, pgvector, RLS, and indexes.

## Local Setup

```bash
npm install
npm run check:env
npm run test
npm run dev
```

The web app can run in demo mode without Supabase credentials. Real persistence requires applying the Supabase migration and setting the environment variables in `.env.local`.

See `docs/accounts-and-credentials.md` before creating production accounts or sharing any deployment credentials.

Deployment steps are in `docs/deployment.md`.
Native capture status and app-store completion notes are in `docs/native-capture.md`.
