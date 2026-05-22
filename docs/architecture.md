# Digital Treasure Box Architecture

## Runtime Shape

Digital Treasure Box is a TypeScript monorepo intended to live in a private GitHub repository. The web app runs on Vercel, creator data lives in Supabase Postgres with pgvector, metadata processing runs in a Cloudflare Worker and queue, browser clipping ships as a Chrome Manifest V3 extension, and mobile capture ships as a minimal Expo app with native share entry points.

## Core Flows

1. A creator logs in with Supabase magic-link auth.
2. A URL arrives from the web paste form, Chrome extension, or mobile share sheet.
3. The capture API stores a pending capture job and sends it to the worker.
4. The worker validates the URL, blocks local/private targets, resolves Open Graph/oEmbed-style metadata, and creates an allowlisted embed config or fallback link card.
5. The dashboard lets the creator move items between inbox, visible shelf, and archive.
6. The public cabinet route renders only visible items from an unguessable share ID with no indexing headers.
7. Archive search uses text search locally in demo mode and pgvector semantic search once Supabase embeddings are populated.

## Safety Defaults

- Public cabinet links are unguessable and non-indexed, but not treated as access control.
- Third-party media is embedded or linked, not copied as full media.
- Arbitrary embed HTML is never rendered directly.
- Public URL capture blocks obvious local/private network targets before metadata fetches.
- Reports and takedown intake are first-class API routes from v1.

