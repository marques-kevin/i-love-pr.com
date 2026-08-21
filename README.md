# iLovePR

Self-hosted, single-user GitHub pull request analytics. A lightweight Swarmia/LinearB-style dashboard that runs entirely in the browser — no backend, no accounts, no webhooks.

## Features

- Paste a GitHub Personal Access Token (stored only in IndexedDB)
- Track one or more `owner/repo` repositories
- Incremental sync with resumeable backfill and rate-limit awareness
- Metrics: cycle time, time to first review, review rounds, PR size, throughput, reviewer load
- Filters by period (7d / 30d / 90d / custom), repo, and team member
- Installable PWA (static hosting on GitHub Pages, Netlify, or Vercel)

## Stack

- React + Vite + TypeScript
- daisyUI 5 + Tailwind CSS v4 (`@plugin "daisyui"` in `src/index.css`)
- Dexie.js (IndexedDB)
- GitHub GraphQL API v4
- Recharts (chart colors mapped to the daisyUI `ilovepr` theme)
- Hugeicons Animated (`src/components/icons/`)
- vite-plugin-pwa

Add a Hugeicons Animated icon with:

```bash
npx shadcn@latest add @hugeicons-animated/<name>
```

Then move the generated file from `src/components/ui/` to `src/components/icons/` and rename it to snake_case.

## Quick start

Requires [Node.js 24+](https://nodejs.org/) (see `.nvmrc`). With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install
nvm use
npm install
npm run dev
```

Open the app, paste a PAT with `repo` (or `public_repo`) read scope, add repositories, and start analyzing.

### Demo mode

Demo mode skips GitHub PAT / onboarding, seeds IndexedDB with the `acme/widgets` workspace (open PRs, bots, metrics), and uses `MemoryGithubClient` so dashboard / sync / settings work without a token.

It is on when `VITE_DEMO_MODE=true` is inlined at **build time** (Vite). There is no runtime `DEV` gate.

- **Local:** `.env.development` sets `VITE_DEMO_MODE=true`, so `npm run dev` still demos. Override with `.env.development.local` (`VITE_DEMO_MODE=false`) for a real PAT flow.
- **Cloudflare Pages Preview** (PR / non-`main` branch): `vite.config.ts` sets `VITE_DEMO_MODE=true` when `CF_PAGES=1` and `CF_PAGES_BRANCH` is set and is not `main`, unless the flag is already set. An explicit Preview env `VITE_DEMO_MODE=false` still disables demo.
- **Cloudflare Pages Production** (`main`): demo stays off. The live app uses onboarding + PAT.

## Build & deploy

```bash
npm run build
```

Deploy the `dist/` folder to any static host.

### Cloudflare Pages

Git-connected auto deploy. **Production** (`main`) is the real app (onboarding + PAT). **Preview** (PR / non-`main` branch) builds auto-enable demo mode unless `VITE_DEMO_MODE` is already set — see [Demo mode](#demo-mode).

Build settings in the Cloudflare dashboard:

- **Build command:** `npm run build`
- **Build output directory:** `dist` (also set in `wrangler.jsonc`)
- **Node version:** `24` (`NODE_VERSION=24` or `.nvmrc`)

#### Repository sharing (R2)

Sharing synced PR snapshots is gated on Cloudflare. Tech Lead provisions the bucket and secrets — do not create buckets or put real secrets in git.

Required Cloudflare Pages / Worker settings:

- **R2 bucket** `ilovepr-shares`, bound as `SHARE_BUCKET` (see `wrangler.jsonc`)
- **Secret** `SHARE_UPLOAD_SECRET` — runtime secret checked by both upload paths (`POST /api/share/upload-url` and `PUT /api/share/upload/:id`). If this var is missing or blank, uploads **fail closed** (403).
- **Build var** `VITE_SHARE_UPLOAD_SECRET` — same value as `SHARE_UPLOAD_SECRET`, so the SPA can send header `x-share-upload-secret`. Optional: `Authorization: Bearer <secret>` is also accepted.

Uploads are capped at **50 MiB**. Declared `content_length` is required to mint an upload URL, but that is not the enforcement: every PUT is proxied through `PUT /api/share/upload/:id`, which checks `SHARE_UPLOAD_SECRET` and the **actual body size**. Direct R2 presigned PUTs are not used (they would bypass the worker cap). Downloads may still use a presigned GET when R2 API credentials are set.

Optional R2 API credentials for true presigned URLs: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`. Without them, upload/download is proxied through Pages Functions.

## Privacy

- The PAT never leaves the browser except for direct calls to `api.github.com`
- All PR metadata lives in IndexedDB
- Use **Settings → Reset local data** if the sync cursor is corrupted, or **Factory reset** to wipe everything

## Sync model

On launch (or force refresh):

1. No local data → full backfill (paginated GraphQL)
2. Data older than the configured interval (default 24h) → incremental refresh from the `updatedAt` cursor
3. Fresh cache → serve local data only

Cursors are persisted after each page so a rate-limit pause can resume later.
