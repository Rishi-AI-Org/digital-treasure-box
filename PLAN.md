# Digital Treasure Box Build Plan

## Summary
Build Digital Treasure Box as a private-first, scalable taste cabinet where logged-in creators curate **up to 21 visible items** and everything else moves into a private semantic archive. Code should live in a **private GitHub monorepo**. The product needs a backend because auth, secret links, metadata fetching, embed safety, archive search, rate limits, and abuse controls cannot be handled safely in the frontend alone.

## Key Decisions
- **Stack:** TypeScript monorepo with `apps/web`, `apps/mobile`, `apps/extension-chrome`, `services/worker`, and shared packages for URL parsing, provider adapters, API types, and UI primitives.
- **Frontend:** Next.js web app on Vercel, with an app-first interface: private dashboard, 21-slot visible cabinet, drag/reorder controls, archive search, and public secret-link view.
- **Backend/data:** Supabase managed Postgres/Auth/Storage with pgvector for semantic archive search; Cloudflare Workers/Queues or equivalent managed queue for async metadata/embed processing.
- **Identity:** Creators must log in. Viewers open secret, unguessable, non-indexed links without logging in. No public discovery, likes, follower counts, ads, or vanity metrics.
- **Capture surfaces:** Ship all three capture paths in v1: web paste, Chrome extension first, and minimal iOS/Android apps mainly for native share-sheet capture.

## Implementation Changes
- **Web app:** Logged-in users manage one cabinet in v1. The editor has a visible shelf capped at 21 items, an archive area, capture inbox, reorder controls, theme controls, and item edit panels for notes, tags, visibility, and YouTube start/end seconds.
- **Public cabinet:** Render a vertical, retro-framed mixed-media profile inspired by modular dating-profile cards, but private and quiet. Use `noindex`, `X-Robots-Tag`, no sitemap exposure, strict referrer policy, and unguessable routes like `/c/{shareId}`.
- **Capture flow:** Every capture creates a pending item/job, then a worker resolves canonical URL, Open Graph metadata, oEmbed/provider embed, thumbnail reference, safety status, and archive embedding. Failed embeds fall back to a clean link card.
- **Embeds:** Use allowlisted provider adapters. Do not blindly render arbitrary oEmbed HTML. Render known providers through controlled components/sandboxed iframes. YouTube clips use `https://www.youtube.com/embed/{videoId}?start={S}&end={E}` with seconds from the beginning of the video.
- **Mobile:** Build minimal React Native/Expo apps with native share integration. iOS uses a Share Extension; Android uses share intents. Shared URLs/text from YouTube, X, Chrome, Amazon, Kindle, etc. open a capture review screen before saving.
- **Chrome extension:** Build Manifest V3 extension for saving current page, selected text, links, and detected media metadata. Extension calls the same authenticated backend API as web/mobile.
- **Data model:** Store users, cabinets, items, captures, provider metadata, share links, archive embeddings, and audit/moderation events. Store canonical URLs, user notes, tags, source type, embed config, and visibility position. Do not rehost third-party media except compliant thumbnails/cache or user-owned uploads.
- **Scale/security:** Add rate limits, URL validation, SSRF protection, malware/phishing checks, takedown/report flow, provider failure tracking, background retries, CDN caching for public cabinet reads, and database indexes for user/archive queries.

## Test Plan
- Unit test URL parsing, YouTube start/end extraction, 21-visible-item enforcement, archive movement, provider fallback behavior, and secret-link generation.
- Integration test capture jobs, metadata fetching, auth permissions, public cabinet reads, archive semantic search, and failed/blocked provider handling.
- E2E test web paste capture, Chrome extension capture, iOS/Android share capture, reorder/edit/archive flows, and public cabinet rendering on mobile/desktop.
- Load test public cabinet views, capture queue throughput, archive search latency, and metadata worker retry behavior.

## Assumptions
- This is a greenfield build in a new private GitHub repo.
- V1 has creator login, secret-link sharing, web paste, Chrome extension, and minimal iOS/Android share capture.
- The product is private-by-design but not encrypted end-to-end in v1.
- Third-party content is embedded or linked, not copied as full media.
- References used: [Chrome Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3), [Apple app extensions](https://developer.apple.com/documentation/technologyoverviews/app-extensions), [Android sharing](https://developer.android.com/training/sharing/send), [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-columns), [YouTube embed parameters](https://developers.google.com/youtube/player_parameters), and [Google noindex docs](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
