# Accounts and Credentials

Do not paste passwords, API keys, service-role keys, or payment details into chat. Create accounts in your browser, store secrets in the service dashboards, and put local development secrets in `.env.local`.

## Required for V1

| Service | Why it is needed | Account/action | Secret values to store |
| --- | --- | --- | --- |
| GitHub | Private monorepo and deployment source | Create a private repo named `digital-treasure-box` | Git remote only; no app secret required locally |
| Supabase | Auth, Postgres, pgvector, storage, RLS | Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Vercel | Next.js web hosting and public cabinet routes | Import the GitHub repo as a Vercel project | Same web env vars as `.env.example` |
| Cloudflare | Worker, queue, metadata fetching, DNS/CDN | Create Worker and Queue named `capture-jobs` | `CAPTURE_WORKER_TOKEN`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EMBEDDING_MODEL` |
| OpenAI Platform | Semantic archive embeddings | Create an API key with embeddings access | `OPENAI_API_KEY` |
| Domain/DNS | Real public URLs and app trust | Buy/connect a domain such as `digitaltreasurebox.app` | DNS records in Cloudflare/Vercel, no local secret |

## Required for Capture Distribution

| Service | Why it is needed | Account/action | Secret values to store |
| --- | --- | --- | --- |
| Chrome Web Store Developer | Publish the Chrome clipper | Create developer account and upload `apps/extension-chrome/dist` | Store credentials in Google account, not repo |
| Apple Developer Program | iOS app and share extension | Create developer account, app identifier, provisioning profiles | Store certs/profiles in Apple/EAS, not repo |
| Google Play Console | Android app and share intents | Create developer account and app listing | Store signing keys in Play/EAS, not repo |
| Expo/EAS | Build iOS and Android binaries | Create Expo account and EAS project | `EXPO_TOKEN` only in CI if needed |

## Strongly Recommended for Production

| Service | Why it is needed | Notes |
| --- | --- | --- |
| Resend or Postmark | Reliable auth emails | Supabase default emails are fine for testing, custom SMTP is better for launch |
| Sentry | Error monitoring | Add to web, worker, extension, and mobile before beta |
| Upstash or Cloudflare Turnstile | Abuse/rate-limit support | Useful for public report forms and capture endpoints |
| Stripe | Paid plans later | Not needed until monetization is defined |

## Local `.env.local`

Create `apps/web/.env.local` for the web app:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CAPTURE_WORKER_URL=http://localhost:8787
CAPTURE_WORKER_TOKEN=
OPENAI_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small
```

For Cloudflare Worker secrets:

```bash
wrangler secret put CAPTURE_WORKER_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Set `SUPABASE_URL` as a Cloudflare Worker variable so the Worker can write resolved metadata and embeddings back to Supabase.

For Vercel, add the same web variables in Project Settings -> Environment Variables.

## Non-secret Details I Need From You

Reply with these only; do not send passwords or keys:

1. GitHub username or organization where the private repo should live.
2. Preferred repo name, default: `digital-treasure-box`.
3. Preferred production domain, default: `digitaltreasurebox.app`.
4. Supabase region preference, default: closest to your main users.
5. Vercel team/account name.
6. Cloudflare account email or account nickname.
7. Public sender email for auth emails, default: `hello@your-domain`.
8. App store display name, default: `Digital Treasure Box`.

## Project Choices

These are the current non-secret project choices:

| Setting | Value |
| --- | --- |
| GitHub organization | `Rishi-AI-Org` |
| GitHub repo | `https://github.com/Rishi-AI-Org/digital-treasure-box` |
| Repo name | `digital-treasure-box` |
| Production domain | `TBD` |
| Supabase region | `Asia Pacific` |
| Vercel team display name | `Rishi Nikam AI's projects` |
| Vercel team slug | `rishi-nikam-ais-projects` |
| Cloudflare account email | `rishinikamai@gmail.com` |
| Auth sender email | `rishinikamai@gmail.com` |
| App display name | `DTB21` |

Because the production domain is not chosen yet, use the Vercel project URL for first deployment and replace it later in `NEXT_PUBLIC_APP_URL`, Supabase redirect URLs, extension host permissions, and mobile deep-link settings.

## Account Creation Order for This Project

1. Create or open the private GitHub repository at `https://github.com/Rishi-AI-Org/digital-treasure-box`.
2. Create a Supabase project in an Asia Pacific region, enable Auth email login, and run `supabase/migrations/001_initial_schema.sql`.
3. Create a Vercel project under `Rishi Nikam AI's projects` / `rishi-nikam-ais-projects` and import the GitHub repo.
4. Create a Cloudflare Worker named `digital-treasure-box-worker` and a Queue named `capture-jobs`.
5. Create an OpenAI API key for embeddings and store it only in Vercel/Cloudflare/local env files.
6. Create Chrome Web Store, Apple Developer, Google Play Console, and Expo/EAS accounts before packaging capture clients.

## Secret Placement

| Secret | Local destination | Production destination |
| --- | --- | --- |
| Supabase anon key | `apps/web/.env.local` | Vercel env var |
| Supabase service-role key | `apps/web/.env.local` | Vercel env var only, never browser/mobile/extension |
| Capture worker token | `apps/web/.env.local` | Vercel env var and Cloudflare Worker secret |
| OpenAI API key | Worker secret for production | Cloudflare Worker secret |
| Supabase URL for worker | Worker var when testing write-back | Cloudflare Worker var |
| Supabase service-role key for worker | Do not expose in browser/mobile/extension | Cloudflare Worker secret |
| Expo token | Not needed for local dev | GitHub Actions/Vercel CI secret if mobile CI is added |
