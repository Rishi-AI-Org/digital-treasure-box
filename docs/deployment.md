# Deployment Runbook

## GitHub

Repository: `https://github.com/Rishi-AI-Org/digital-treasure-box`

```bash
git init
git remote add origin https://github.com/Rishi-AI-Org/digital-treasure-box.git
git add .
git commit -m "Initial DTB21 monorepo"
git branch -M main
git push -u origin main
```

Do this only after the private repository exists in GitHub.

## Supabase

1. Create a Supabase project in an Asia Pacific region.
2. Open SQL Editor.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Enable email magic-link auth.
5. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - your Vercel production URL plus `/auth/callback`
   - your custom domain plus `/auth/callback` when a domain is connected.

Copy these to `apps/web/.env.local` and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Vercel

1. Import `Rishi-AI-Org/digital-treasure-box`.
2. Keep the project root at the repository root so workspace packages resolve.
3. Use the Vercel team `rishi-nikam-ais-projects`.
4. Use the root `vercel.json` build command: `npm run build -w @dtb/web`.
5. Add environment variables:

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CAPTURE_WORKER_URL=
CAPTURE_WORKER_TOKEN=
OPENAI_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small
```

Set `NEXT_PUBLIC_APP_URL` to the Vercel URL first, then replace it when a custom domain is connected.

## Cloudflare Worker

```bash
cd services/worker
npm run deploy
```

Before deploy:

```bash
wrangler queues create capture-jobs
wrangler secret put CAPTURE_WORKER_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Set `SUPABASE_URL` in `services/worker/wrangler.toml` or in the Cloudflare dashboard before deploy.

Use the same `CAPTURE_WORKER_TOKEN` in Vercel and Cloudflare.

## Chrome Extension

```bash
cd apps/extension-chrome
npm run build
```

Upload `apps/extension-chrome/dist` to Chrome Web Store. Before publishing, replace host permissions in `manifest.json` with the final production domain.

## Mobile

```bash
cd apps/mobile
npx expo start
```

For app-store builds, configure EAS and keep signing credentials inside Expo/Apple/Google dashboards, not in the repo.
